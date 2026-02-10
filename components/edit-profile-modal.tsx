import { View, Text, Modal, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useState, useEffect } from "react";
import { X, User, Check } from "lucide-react-native";
import { API_URL } from "../constants/config";
import { getAuthHeader } from "../lib/auth";

// Safe import for Google Signin
let GoogleSignin: any = { getTokens: async () => { throw new Error("Not initialized") } };
try { GoogleSignin = require("@react-native-google-signin/google-signin").GoogleSignin; } catch (e) { }

interface EditProfileModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: (updatedUser: any) => void;
    currentUser: { id?: string; name?: string; email?: string; } | null;
}

export function EditProfileModal({ visible, onClose, onSuccess, currentUser }: EditProfileModalProps) {
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (visible && currentUser) {
            setName(currentUser.name || "");
            setError(null);
        }
    }, [visible, currentUser]);



    const handleSave = async () => {
        if (!name.trim()) {
            setError("Name is required");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const headers = await getAuthHeader();
            const res = await fetch(`${API_URL}/mobile/users/me`, {
                method: 'PATCH',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim() })
            });

            if (res.ok) {
                const updatedUser = await res.json();

                // Update AsyncStorage
                const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                const storedUser = await AsyncStorage.getItem('user_data');
                if (storedUser) {
                    const userData = JSON.parse(storedUser);
                    userData.name = name.trim();
                    await AsyncStorage.setItem('user_data', JSON.stringify(userData));
                }

                onSuccess(updatedUser);
                onClose();
            } else {
                const errData = await res.json();
                setError(errData.error || "Failed to update profile");
            }
        } catch (e) {
            console.error("Update profile error:", e);
            setError("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                className="flex-1 justify-end bg-black/50"
            >
                <Pressable className="flex-1" onPress={onClose} />

                <View className="bg-white mx-4 mb-6 rounded-[24px] overflow-hidden shadow-2xl" style={{ maxHeight: '80%' }}>
                    {/* Header */}
                    <View className="px-5 pt-5 pb-4 border-b border-gray-100">
                        <View className="flex-row justify-between items-center">
                            <Text className="text-lg font-bold text-gray-900">Edit Profile</Text>
                            <Pressable onPress={onClose} className="bg-gray-100 p-2 rounded-full">
                                <X size={18} color="#64748b" />
                            </Pressable>
                        </View>
                    </View>

                    {/* Content */}
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
                        {/* Name Field */}
                        <View className="mb-4">
                            <Text className="text-gray-500 text-[10px] font-bold uppercase mb-2 ml-1">Your Name</Text>
                            <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                                <User size={18} color="#9ca3af" />
                                <TextInput
                                    className="flex-1 ml-3 text-gray-900 text-[15px]"
                                    placeholder="Enter your name"
                                    placeholderTextColor="#9ca3af"
                                    value={name}
                                    onChangeText={setName}
                                    autoFocus
                                />
                            </View>
                        </View>

                        {/* Email (Read-only) */}
                        <View className="mb-4">
                            <Text className="text-gray-500 text-[10px] font-bold uppercase mb-2 ml-1">Email</Text>
                            <View className="bg-gray-100 rounded-xl px-4 py-3 border border-gray-200">
                                <Text className="text-gray-500 text-[14px]">{currentUser?.email || "-"}</Text>
                            </View>
                            <Text className="text-gray-400 text-[10px] mt-1 ml-1">Email cannot be changed</Text>
                        </View>

                        {/* Error */}
                        {error && (
                            <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                                <Text className="text-red-600 text-sm">{error}</Text>
                            </View>
                        )}

                        {/* Save Button */}
                        <Pressable
                            onPress={handleSave}
                            disabled={isLoading}
                            className={`h-12 rounded-xl items-center justify-center flex-row gap-2 ${isLoading ? 'bg-gray-300' : 'bg-gray-900'}`}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <>
                                    <Check size={18} color="white" strokeWidth={2.5} />
                                    <Text className="text-white font-bold text-[14px]">Save Changes</Text>
                                </>
                            )}
                        </Pressable>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
