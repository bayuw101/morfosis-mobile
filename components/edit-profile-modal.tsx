import { View, Text, Modal, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useState, useEffect } from "react";
import { X, User, Check } from "lucide-react-native";
import { API_URL } from "../constants/config";
import { getAuthHeader } from "../lib/auth";
import { useTheme } from "../context/theme-context";
import { useLanguage } from "../context/language-context";

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
    const { isDark } = useTheme();
    const { t } = useLanguage();
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
            setError(t('editProfile.nameRequired'));
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
                setError(errData.error || t('editProfile.updateFailed'));
            }
        } catch (e) {
            console.error("Update profile error:", e);
            setError(t('editProfile.networkError'));
        } finally {
            setIsLoading(false);
        }
    };

    const sheetBg = isDark ? '#1f2937' : '#ffffff';
    const headerBorder = isDark ? '#374151' : '#f3f4f6';
    const titleColor = isDark ? '#f9fafb' : '#111827';
    const labelColor = isDark ? '#9ca3af' : '#6b7280';
    const inputBg = isDark ? '#374151' : '#f9fafb';
    const inputBorder = isDark ? '#4b5563' : '#e5e7eb';
    const inputText = isDark ? '#f9fafb' : '#111827';
    const closeBtnBg = isDark ? '#374151' : '#f3f4f6';
    const closeIconColor = isDark ? '#d1d5db' : '#64748b';
    const disabledBg = isDark ? '#4b5563' : '#f3f4f6';
    const disabledText = isDark ? '#9ca3af' : '#6b7280';
    const hintColor = isDark ? '#6b7280' : '#9ca3af';

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                className="flex-1 justify-end bg-black/50"
            >
                <Pressable className="flex-1" onPress={onClose} />

                <View style={{ backgroundColor: sheetBg, maxHeight: '80%' }} className="mx-4 mb-6 rounded-[24px] overflow-hidden shadow-2xl">
                    {/* Header */}
                    <View style={{ borderBottomColor: headerBorder }} className="px-5 pt-5 pb-4 border-b">
                        <View className="flex-row justify-between items-center">
                            <Text style={{ color: titleColor }} className="text-lg font-bold">{t('editProfile.title')}</Text>
                            <Pressable onPress={onClose} style={{ backgroundColor: closeBtnBg }} className="p-2 rounded-full">
                                <X size={18} color={closeIconColor} />
                            </Pressable>
                        </View>
                    </View>

                    {/* Content */}
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
                        {/* Name Field */}
                        <View className="mb-4">
                            <Text style={{ color: labelColor }} className="text-[10px] font-bold uppercase mb-2 ml-1">{t('editProfile.yourName')}</Text>
                            <View style={{ backgroundColor: inputBg, borderColor: inputBorder }} className="flex-row items-center rounded-xl px-4 py-3 border">
                                <User size={18} color={hintColor} />
                                <TextInput
                                    className="flex-1 ml-3 text-[15px]"
                                    style={{ color: inputText }}
                                    placeholder={t('editProfile.namePlaceholder')}
                                    placeholderTextColor={hintColor}
                                    value={name}
                                    onChangeText={setName}
                                    autoFocus
                                />
                            </View>
                        </View>

                        {/* Email (Read-only) */}
                        <View className="mb-4">
                            <Text style={{ color: labelColor }} className="text-[10px] font-bold uppercase mb-2 ml-1">{t('editProfile.email')}</Text>
                            <View style={{ backgroundColor: disabledBg, borderColor: inputBorder }} className="rounded-xl px-4 py-3 border">
                                <Text style={{ color: disabledText }} className="text-[14px]">{currentUser?.email || "-"}</Text>
                            </View>
                            <Text style={{ color: hintColor }} className="text-[10px] mt-1 ml-1">{t('editProfile.emailCannotBeChanged')}</Text>
                        </View>

                        {/* Error */}
                        {error && (
                            <View style={{ backgroundColor: isDark ? '#451a1a' : '#fef2f2', borderColor: isDark ? '#7f1d1d' : '#fecaca' }} className="rounded-xl p-3 mb-4 border">
                                <Text className="text-red-500 text-sm">{error}</Text>
                            </View>
                        )}

                        {/* Save Button */}
                        <Pressable
                            onPress={handleSave}
                            disabled={isLoading}
                            style={{ backgroundColor: isLoading ? (isDark ? '#4b5563' : '#d1d5db') : (isDark ? '#3b82f6' : '#111827') }}
                            className="h-12 rounded-xl items-center justify-center flex-row gap-2"
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <>
                                    <Check size={18} color="white" strokeWidth={2.5} />
                                    <Text className="text-white font-bold text-[14px]">{t('editProfile.saveChanges')}</Text>
                                </>
                            )}
                        </Pressable>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
