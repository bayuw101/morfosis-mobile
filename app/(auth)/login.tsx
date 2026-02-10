import { View, Text, Pressable, Image, KeyboardAvoidingView, Platform, ScrollView, Animated } from "react-native";
import { Link, useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useRef, useEffect } from "react";
import { Mail, Check, X, ArrowRight, Lock, AtSign } from "lucide-react-native";
import { API_URL } from "../../constants/config";
import { FullScreenLoader } from "../../components/ui/loaders"; // Updated import
import { Input } from "../../components/input";
import { Button } from "../../components/ui/button"; // New component
import GoogleIcon from "../../assets/google-icon.svg";
import { getAuthHeader } from "../../lib/auth";
import { getAuth, GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword, getIdToken } from "@react-native-firebase/auth";
import { GoogleSignin, statusCodes } from "../../lib/google-auth";

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const inviteToken = params.invite as string;
  const auth = getAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Animation for entrance
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true })
    ]).start();
  }, []);

  // MOCK invite details (Should eventually fetch real details)
  const [inviteDetails, setInviteDetails] = useState<{ family_name: string, inviter_name?: string } | null>(
    inviteToken ? { family_name: "Smith Family", inviter_name: "John Smith" } : null
  );

  /* Google Sign In Configuration */
  useEffect(() => {
    // configureGoogleSignin is async/void, we can just call it
    // but check if google-auth lib exports it properly or if we need to call it on module level
    // Assuming previous code worked, keeping it but checking imports
    // Actually, configureGoogleSignin was removed from import above, let's fix that
    const { configureGoogleSignin } = require("../../lib/google-auth");
    configureGoogleSignin();
  }, []);

  const handleGoogle = async () => {
    try {
      const hasPlay = await GoogleSignin.hasPlayServices();
      if (!hasPlay) {
        setError("Google Play Services are not available.");
        return;
      }

      const userInfo = await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();

      if (!idToken) {
        throw new Error("No ID token returned from Google Sign In");
      }

      console.log("Google Sign In Success, Exchanging for Firebase Credential...");

      const googleCredential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, googleCredential);
      const firebaseIdToken = await getIdToken(userCredential.user);

      console.log("Firebase Login Success, Verifying with Backend...");

      // Verify token with backend
      try {
        const res = await fetch(`${API_URL}/auth/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: firebaseIdToken })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to verify token with backend");
        }

        console.log("Backend Verification Success:", data);
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('user_data', JSON.stringify(data.user));

        // Process invitation if present
        if (inviteToken) {
          try {
            const headers = await getAuthHeader();
            const verifyRes = await fetch(`${API_URL}/mobile/invitations/verify?token=${inviteToken}`, { headers });
            if (verifyRes.ok) {
              const inviteData = await verifyRes.json();
              await fetch(`${API_URL}/mobile/invitations/respond`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ invitationId: inviteData.id, action: 'accept' })
              });
              console.log("Invitation auto-accepted");
            }
          } catch (e) {
            console.error("Failed to process invitation:", e);
          }
        }

        router.replace("/(dashboard)");
      } catch (backendError) {
        console.error("Backend verification failed:", backendError);
        setError("Failed to create account with Google. Please try again.");
      }
    } catch (error: any) {
      if (statusCodes && error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("User cancelled the login flow");
      } else if (statusCodes && error.code === statusCodes.IN_PROGRESS) {
        console.log("Sign in is in progress already");
      } else if (statusCodes && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log("Play services not available or outdated");
        setError("Google Play Services are not available on this device.");
      } else {
        console.error("Checking Google Sign-In Error: ", error);
        setError("Google Sign-In failed or not available.");
      }
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Authenticating...");
    setError(null);

    try {
      console.log(`Signing in with Firebase...`);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseIdToken = await getIdToken(userCredential.user);

      console.log("Firebase Login Success, Verifying with Backend...");

      const res = await fetch(`${API_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: firebaseIdToken })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setIsLoading(false);
      } else {
        console.log("Login success:", data.user);

        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
        } catch (e) {
          console.error("Failed to save user data", e);
        }

        setLoadingMessage("Redirecting...");

        if (inviteToken) {
          try {
            const headers = await getAuthHeader();
            const verifyRes = await fetch(`${API_URL}/mobile/invitations/verify?token=${inviteToken}`, { headers });
            if (verifyRes.ok) {
              const inviteData = await verifyRes.json();
              await fetch(`${API_URL}/mobile/invitations/respond`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ invitationId: inviteData.id, action: 'accept' })
              });
              console.log("Invitation auto-accepted");
            }
          } catch (e) {
            console.error("Failed to process invitation:", e);
          }
        }

        setTimeout(() => {
          router.replace("/(dashboard)");
        }, 500);
      }
    } catch (err: any) {
      console.error("Login attempt failed:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("Invalid email or password");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Too many attempts. Please try again later.");
      } else {
        setError("Connection error. Ensure backend is running.");
      }
      setIsLoading(false);
    }
  };

  const handleSignUpClick = () => {
    setIsLoading(true);
    setLoadingMessage("Going to registration...");
    setTimeout(() => {
      router.push(inviteToken ? `/(auth)/register?invite=${inviteToken}` : "/(auth)/register");
      setTimeout(() => setIsLoading(false), 500);
    }, 100);
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <FullScreenLoader isLoading={isLoading} message={loadingMessage} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* Header */}
            <View className="items-center mb-10">
              <View className="h-20 w-52 mb-6 shadow-sm shadow-blue-100/50 border-b border-gray-200 pb-2">
                <Image
                  source={require("../../assets/morfosis.webp")}
                  style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                />
              </View>
              <Text className="text-gray-500 text-center font-medium max-w-[250px]">
                Master your family finances with elegance and simplicity.
              </Text>

              {inviteDetails && (
                <View className="mt-8 w-full bg-blue-50/80 border border-blue-100 rounded-2xl p-5 relative overflow-hidden">
                  <View className="absolute top-0 right-0 w-20 h-20 bg-blue-100/50 rounded-full -mr-10 -mt-10 blur-xl" />

                  <Pressable
                    onPress={() => setInviteDetails(null)}
                    className="absolute top-3 right-3 p-2 z-10 bg-white/50 rounded-full"
                  >
                    <X size={14} color="#64748b" />
                  </Pressable>

                  <View className="flex-row items-center gap-4">
                    <View className="h-12 w-12 bg-white flex items-center justify-center rounded-xl shadow-sm border border-blue-50">
                      <Mail size={22} color="#2563eb" />
                    </View>

                    <View className="flex-1">
                      <Text className="text-xs font-bold text-blue-600 uppercase mb-1">Invitation Pending</Text>
                      <Text className="text-sm text-gray-700 leading-snug">
                        You've been invited to join the <Text className="font-bold text-gray-900">{inviteDetails.family_name}</Text>
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Form */}
            <View className="gap-6">
              {error && (
                <View className="bg-red-50 p-4 rounded-2xl border border-red-100 flex-row items-center gap-3">
                  <View className="w-1.5 h-full bg-red-500 rounded-full" />
                  <Text className="text-red-600 text-sm font-medium flex-1">{error}</Text>
                </View>
              )}

              <Input
                label="Email Address"
                placeholder="name@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                icon={<AtSign size={18} color="#9ca3af" />}
              />

              <View className="gap-2">
                <Input
                  label="Password"
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  icon={<Lock size={18} color="#9ca3af" />}
                />
                <View className="items-end">
                  <Link href="/(auth)/register" className="py-2">
                    <Text className="text-xs font-bold text-gray-500">Forgot Password?</Text>
                  </Link>
                </View>
              </View>

              <Button
                label="Sign In"
                onPress={handleLogin}
                rightIcon={<ArrowRight size={18} color="white" />}
                size="lg"
              />
            </View>

            {/* Divider */}
            <View className="relative my-8 items-center justify-center">
              <View className="absolute w-full h-[1px] bg-gray-100" />
              <View className="bg-white px-4">
                <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Or</Text>
              </View>
            </View>

            {/* Social Login */}
            <Pressable
              onPress={handleGoogle}
              className="w-full flex-row items-center justify-center gap-3 bg-white border border-gray-200 rounded-2xl h-14 shadow-sm active:bg-gray-50"
            >
              <GoogleIcon width={24} height={24} />
              <Text className="text-gray-700 font-bold text-[15px]">Continue with Google</Text>
            </Pressable>

            {/* Footer */}
            <View className="mt-10 items-center">
              <Pressable onPress={handleSignUpClick} className="flex-row items-center gap-1.5 py-2 px-4 rounded-lg">
                <Text className="text-gray-500 text-[15px]">Not a member yet?</Text>
                <Text className="text-gray-900 font-bold text-[15px]">Sign Up</Text>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
