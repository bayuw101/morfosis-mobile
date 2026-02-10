import { View, Text, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { API_URL } from "../../constants/config";
import { getAuthHeader } from "../../lib/auth";
import { Check, X, AlertTriangle } from "lucide-react-native";

export default function JoinFamilyScreen() {
    const { token } = useLocalSearchParams<{ token: string }>();
    const router = useRouter();
    const [status, setStatus] = useState<'validating' | 'success' | 'error'>('validating');
    const [errorMsg, setErrorMsg] = useState("");



    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMsg("Invalid invitation link.");
            return;
        }

        const processInvite = async () => {
            try {
                const headers = await getAuthHeader();

                // If NOT logged in, redirect to login page with token
                if (!headers.Authorization) {
                    router.replace(`/(auth)/login?invite=${token}`);
                    return;
                }

                // Verify Token
                const res = await fetch(`${API_URL}/mobile/invitations/verify?token=${token}`, { headers });

                if (res.ok) {
                    const inviteData = await res.json();

                    // Auto Accept
                    await fetch(`${API_URL}/mobile/invitations/respond`, {
                        method: 'POST',
                        headers: { ...headers, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ invitationId: inviteData.id, action: 'accept' })
                    });

                    setStatus('success');
                    setTimeout(() => {
                        router.replace("/(dashboard)");
                    }, 1500);

                } else {
                    const d = await res.json();
                    setStatus('error');
                    setErrorMsg(d.error || "Invitation invalid or expired.");
                }

            } catch (e) {
                setStatus('error');
                setErrorMsg("Something went wrong.");
            }
        };

        processInvite();
    }, [token]);

    if (status === 'validating') {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#2563eb" />
                <Text className="mt-4 text-gray-500 font-bold">Verifying invitation...</Text>
            </View>
        );
    }

    if (status === 'success') {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <View className="h-16 w-16 bg-green-100 rounded-full items-center justify-center mb-6">
                    <Check size={32} color="#16a34a" />
                </View>
                <Text className="text-xl font-bold text-gray-900">Welcome to the Family!</Text>
                <Text className="text-gray-500 mt-2">Redirecting to dashboard...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 items-center justify-center bg-white p-6">
            <View className="h-16 w-16 bg-red-100 rounded-full items-center justify-center mb-6">
                <AlertTriangle size={32} color="#dc2626" />
            </View>
            <Text className="text-xl font-bold text-gray-900 text-center mb-2">Invitation Error</Text>
            <Text className="text-gray-500 text-center mb-8">{errorMsg}</Text>

            <Text className="text-blue-600 font-bold" onPress={() => router.replace("/(dashboard)")}>
                Go to Dashboard
            </Text>
        </View>
    );
}
