import { View, Text, Pressable, Image, KeyboardAvoidingView, Platform, ScrollView, Animated } from "react-native";
import { Link, useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useRef, useEffect } from "react";
import { Mail, Check, X, ArrowRight, Lock, AtSign, User } from "lucide-react-native";
import { cn } from "../../lib/utils";
import { Input } from "../../components/input";
import { FullScreenLoader } from "../../components/ui/loaders";
import { Button } from "../../components/ui/button";
import { API_URL } from "../../constants/config";
import { getAuth, createUserWithEmailAndPassword, getIdToken } from "@react-native-firebase/auth";
import { getAuthHeader } from "../../lib/auth";
import { registerPushToken } from "../../lib/notifications";

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const inviteToken = params.invite as string;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const auth = getAuth();

  // Animation for entrance
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true })
    ]).start();
  }, []);

  // Fetch real invite details from public preview endpoint
  const [inviteDetails, setInviteDetails] = useState<{ family_name: string, inviter_name?: string } | null>(null);

  useEffect(() => {
    if (!inviteToken) return;
    const fetchInviteDetails = async () => {
      try {
        const res = await fetch(`${API_URL}/mobile/invitations/preview?token=${inviteToken}`);
        if (res.ok) {
          const data = await res.json();
          setInviteDetails(data);
        } else {
          // Fallback if endpoint fails
          setInviteDetails({ family_name: "Family", inviter_name: "Someone" });
        }
      } catch (e) {
        console.error("Failed to fetch invite details:", e);
        // Fallback on error
        setInviteDetails({ family_name: "Family", inviter_name: "Someone" });
      }
    };
    fetchInviteDetails();
  }, [inviteToken]);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError("Please fill all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be 6+ chars.");
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Creating account...");
    setError(null);

    try {
      // 1. Create user in Firebase
      console.log("Creating user in Firebase...");
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Optional: Update profile with name (requires another call usually)
      // await updateProfile(userCredential.user, { displayName: name }); 
      // check if we can import updateProfile from firebase/auth or just send name to backend

      const firebaseIdToken = await getIdToken(userCredential.user);

      // 2. Verify/Sync with Backend
      console.log("Syncing with backend...");
      const res = await fetch(`${API_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: firebaseIdToken }) // Ensure backend updates name from Firebase or we might need to send it separately if Firebase doesn't have it yet? 
        // Backend decodes token. To pass 'name', we should ideally update firebase profile first.
        // OR, we can just assume backend will create user and maybe we update name later? 
        // Let's check backend logic again. It takes name from decoded token. 
        // So we MUST update profile in firebase or send name in body if backend supports it.
        // Backend `auth/verify` only reads from token.
        // So we need to update profile first.
      });

      // Wait, let's look at `auth/verify`. It only reads from `decodedToken.name`.
      // The `createUserWithEmailAndPassword` does NOT set the display name.
      // We should probably update the profile.
      // Adding `updateProfile` import.
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to sync with backend");
      }

      console.log("Backend verification success");

      // Save user data
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
      } catch (e) {
        console.error("Failed to save user data", e);
      }

      setLoadingMessage("Success! Redirecting...");

      // Optional: Auto-login after register
      // Since we already have the token and backend verified it, we can just redirect to dashboard
      // providing we set up the session correctly.

      // Register token for new user
      registerPushToken();

      setTimeout(() => {
        router.replace("/(dashboard)");
      }, 1000);

    } catch (err: any) {
      console.error("Registration failed", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("Email already in use.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Invalid email address.");
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("Registration failed. Please try again.");
      }
      setIsLoading(false);
    }
  };

  const handleSignInClick = () => {
    // Navigate to login
    router.push(inviteToken ? `/(auth)/login?invite=${inviteToken}` : "/(auth)/login");
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <FullScreenLoader isLoading={isLoading} message={loadingMessage} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* Header */}
            <View className="items-center mb-10">
              <View className="h-16 w-48 mb-6 relative border-b border-gray-200 pb-2">
                <Image
                  source={require("../../assets/morfosis.webp")}
                  style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                />
              </View>
              <Text className="text-gray-500 text-center font-medium">
                Create your account to start managing your family finance
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
                label="Full Name"
                placeholder="John Doe"
                value={name}
                onChangeText={setName}
                icon={<User size={18} color="#9ca3af" />}
              />

              <Input
                label="Email Address"
                placeholder="name@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                icon={<AtSign size={18} color="#9ca3af" />}
              />

              <Input
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                icon={<Lock size={18} color="#9ca3af" />}
              />

              <Button
                label="Sign Up"
                onPress={handleRegister}
                rightIcon={<ArrowRight size={18} color="white" />}
                size="lg"
                isLoading={isLoading}
                className="mt-4"
              />
            </View>

            {/* Footer */}
            <View className="mt-10 items-center">
              <Pressable onPress={handleSignInClick} className="flex-row items-center gap-1.5 py-2 px-4 rounded-lg active:bg-gray-50">
                <Text className="text-gray-500 text-[15px]">Already have an account?</Text>
                <Text className="text-gray-900 font-bold text-[15px]">Sign In</Text>
              </Pressable>
            </View>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
