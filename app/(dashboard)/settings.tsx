import { View, Text, ScrollView, Pressable, Image, Alert, ActivityIndicator, Switch, Modal, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    CreditCard,
    Bell,
    Shield,
    HelpCircle,
    LogOut,
    ChevronRight,
    Users,
    Palette,
    Globe,
    Smartphone,
    Check,
    X,
    Pencil,
    Tags
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { API_URL } from "../../constants/config";
import { cn } from "../../lib/utils";
import { FamilyManagementModal } from "../../components/family/family-modal";
import { AccountManagementModal } from "../../components/accounts/account-modal";
import { CategoryManagementModal } from "../../components/category/category-modal";
import { EditProfileModal } from "../../components/edit-profile-modal";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from "expo-status-bar";

// Auth Header Helper
import { getAuthHeader } from "../../lib/auth";

// Theme & Language Contexts
import { useTheme, ThemeMode } from "../../context/theme-context";
import { useLanguage } from "../../context/language-context";
import { LanguageCode } from "../../lib/i18n";

interface SettingsItemProps {
    icon: React.ElementType;
    iconColor: string;
    iconBg: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    disabled?: boolean;
    isDark?: boolean;
}

function SettingsItem({ icon: Icon, iconColor, iconBg, title, subtitle, onPress, rightElement, disabled, isDark }: SettingsItemProps) {
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled || !onPress}
            style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff' }}
            className={cn(
                "flex-row items-center p-4",
                (disabled || !onPress) ? "" : (isDark ? "active:bg-gray-700" : "active:bg-gray-50")
            )}
        >
            <View
                className="h-11 w-11 rounded-xl items-center justify-center mr-4"
                style={{ backgroundColor: iconBg }}
            >
                <Icon size={22} color={iconColor} />
            </View>
            <View className="flex-1 mr-2">
                <Text style={{ color: isDark ? '#f9fafb' : '#111827' }} className="font-semibold text-[15px]">{title}</Text>
                {subtitle && <Text style={{ color: isDark ? '#9ca3af' : '#6b7280' }} className="text-xs mt-0.5">{subtitle}</Text>}
            </View>
            {rightElement || (onPress && <ChevronRight size={20} color={isDark ? '#6b7280' : '#cbd5e1'} />)}
        </Pressable>
    );
}

function SettingsSectionHeader({ title, isDark }: { title: string; isDark?: boolean }) {
    return (
        <Text style={{ color: isDark ? '#9ca3af' : '#9ca3af' }} className="text-xs font-bold uppercase px-6 pt-6 pb-2">{title}</Text>
    );
}

// Generic Selection Modal
interface SelectionModalProps {
    visible: boolean;
    title: string;
    options: { label: string; value: string; description?: string }[];
    selectedValue: string;
    onSelect: (value: string) => void;
    onClose: () => void;
}

function SelectionModal({ visible, title, options, selectedValue, onSelect, onClose, isDark }: SelectionModalProps & { isDark?: boolean }) {
    return (
        <Modal visible={visible} animationType="fade" transparent>
            <Pressable className="flex-1 bg-black/50 justify-end" onPress={onClose}>
                <Pressable style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff' }} className="rounded-t-[32px] overflow-hidden" onPress={e => e.stopPropagation()}>
                    <View style={{ borderBottomColor: isDark ? '#374151' : '#f3f4f6' }} className="p-5 border-b flex-row items-center justify-between">
                        <Text style={{ color: isDark ? '#f9fafb' : '#111827' }} className="text-xl font-bold">{title}</Text>
                        <Pressable onPress={onClose} style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6' }} className="p-2 rounded-full">
                            <X size={20} color={isDark ? '#d1d5db' : '#374151'} />
                        </Pressable>
                    </View>
                    <View className="pb-8 pt-2">
                        {options.map((option) => (
                            <Pressable
                                key={option.value}
                                onPress={() => { onSelect(option.value); onClose(); }}
                                className={cn("flex-row items-center justify-between px-6 py-4", isDark ? "active:bg-gray-700" : "active:bg-gray-50")}
                            >
                                <View>
                                    <Text style={{ color: selectedValue === option.value ? '#2563eb' : (isDark ? '#f9fafb' : '#111827') }} className="text-base font-semibold">
                                        {option.label}
                                    </Text>
                                    {option.description && (
                                        <Text style={{ color: isDark ? '#9ca3af' : '#6b7280' }} className="text-xs mt-0.5">{option.description}</Text>
                                    )}
                                </View>
                                {selectedValue === option.value && (
                                    <View className="bg-blue-100 p-1 rounded-full">
                                        <Check size={16} color="#2563eb" strokeWidth={3} />
                                    </View>
                                )}
                            </Pressable>
                        ))}
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

// Simple Info Modal
interface InfoModalProps {
    visible: boolean;
    title: string;
    content: string;
    onClose: () => void;
}

function InfoModal({ visible, title, content, onClose, isDark }: InfoModalProps & { isDark?: boolean }) {
    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={{ backgroundColor: isDark ? '#111827' : '#ffffff' }} className="flex-1">
                <View style={{ borderBottomColor: isDark ? '#374151' : '#f3f4f6' }} className="px-5 py-4 border-b flex-row items-center justify-between mt-2">
                    <Text style={{ color: isDark ? '#f9fafb' : '#111827' }} className="text-xl font-bold">{title}</Text>
                    <Pressable onPress={onClose} style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6' }} className="p-2 rounded-full">
                        <X size={20} color={isDark ? '#d1d5db' : '#374151'} />
                    </Pressable>
                </View>
                <ScrollView className="flex-1 px-6 py-6" contentContainerStyle={{ paddingBottom: 40 }}>
                    <Text style={{ color: isDark ? '#d1d5db' : '#4b5563' }} className="text-base leading-relaxed">{content}</Text>
                </ScrollView>
            </View>
        </Modal>
    );
}

export default function SettingsScreen() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Theme & Language from Context
    const { themeMode, setThemeMode, isDark } = useTheme();
    const { language, setLanguage, t } = useLanguage();

    // Modals state
    const [familyModalVisible, setFamilyModalVisible] = useState(false);
    const [accountModalVisible, setAccountModalVisible] = useState(false);
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);

    // Preference State (notifications only - theme/language handled by context)
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    // Selection Modals
    const [showThemeModal, setShowThemeModal] = useState(false);
    const [showLanguageModal, setShowLanguageModal] = useState(false);

    // Info Modals
    const [infoModal, setInfoModal] = useState<{ visible: boolean; title: string; content: string }>({
        visible: false, title: "", content: ""
    });

    const fetchUser = useCallback(async () => {
        try {
            const storedUser = await AsyncStorage.getItem('user_data');
            if (storedUser) setUser(JSON.parse(storedUser));

            // Load preferences (only notifications - theme/language handled by contexts)
            const storedPrefs = await AsyncStorage.getItem('app_preferences');
            if (storedPrefs) {
                const prefs = JSON.parse(storedPrefs);
                setNotificationsEnabled(prefs.notifications ?? true);
            }

            const headers = await getAuthHeader();
            const res = await fetch(`${API_URL}/mobile/users/me`, { headers });
            if (res.ok) {
                const freshUser = await res.json();
                setUser(freshUser);
                await AsyncStorage.setItem('user_data', JSON.stringify(freshUser));
            }
        } catch (e) {
            console.error("Fetch user error:", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const savePreference = async (key: string, value: any) => {
        try {
            const currentPrefs = JSON.parse(await AsyncStorage.getItem('app_preferences') || '{}');
            const newPrefs = { ...currentPrefs, [key]: value };
            await AsyncStorage.setItem('app_preferences', JSON.stringify(newPrefs));
        } catch (e) { console.error("Save pref error", e); }
    };

    const handleLogout = async () => {
        Alert.alert(
            t('settings.signOutConfirmTitle'),
            t('settings.signOutConfirmMessage'),
            [
                { text: t('common.cancel'), style: "cancel" },
                {
                    text: t('settings.signOut'),
                    style: "destructive",
                    onPress: async () => {
                        setIsLoggingOut(true);
                        try {
                            const { GoogleSignin } = require("@react-native-google-signin/google-signin");
                            await GoogleSignin.signOut();
                            await AsyncStorage.removeItem('user_data');
                            router.replace('/(auth)/login');
                        } catch (e) {
                            console.error("Logout error:", e);
                            router.replace('/(auth)/login');
                        } finally {
                            setIsLoggingOut(false);
                        }
                    }
                }
            ]
        );
    };

    const themeLabel = {
        light: t('theme.light'),
        dark: t('theme.dark'),
        system: t('theme.system')
    }[themeMode];

    const langLabel = {
        en: t('language.en'),
        id: t('language.id')
    }[language];

    const showSupportInfo = (type: 'help' | 'privacy') => {
        const content = type === 'help'
            ? t('help.content')
            : t('privacy.content');

        setInfoModal({
            visible: true,
            title: type === 'help' ? t('help.title') : t('privacy.title'),
            content
        });
    };

    return (
        <View style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
            <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#1f2937' : '#ffffff' }}>
                {/* Header */}
                <View style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', borderBottomColor: isDark ? '#374151' : '#f3f4f6' }} className="px-6 py-4 border-b mb-2">
                    <Text style={{ color: isDark ? '#f9fafb' : '#111827' }} className="text-2xl font-bold">{t('settings.title')}</Text>
                </View>

                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 120 }}
                >
                    {/* Profile Card */}
                    <View style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', borderColor: isDark ? '#374151' : '#f3f4f6' }} className="mx-4 mt-4 rounded-3xl border overflow-hidden shadow-sm">
                        <View className="p-5 flex-row items-center">
                            <View className="h-16 w-16 rounded-2xl bg-gray-900 items-center justify-center overflow-hidden mr-4 shadow-sm">
                                {user?.picture ? (
                                    <Image
                                        source={{ uri: user.picture }}
                                        style={{ width: '100%', height: '100%' }}
                                    />
                                ) : (
                                    <Text className="text-white font-bold text-xl">
                                        {user?.name?.charAt(0) || "U"}
                                    </Text>
                                )}
                            </View>
                            <View className="flex-1 mr-2">
                                <Text style={{ color: isDark ? '#f9fafb' : '#111827' }} className="font-bold text-lg" numberOfLines={1}>
                                    {user?.name || "User"}
                                </Text>
                                <Text style={{ color: isDark ? '#9ca3af' : '#6b7280' }} className="text-sm" numberOfLines={1}>
                                    {user?.email || "Loading..."}
                                </Text>
                            </View>
                            <Pressable
                                onPress={() => setEditProfileModalVisible(true)}
                                style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6' }}
                                className="h-10 w-10 rounded-xl items-center justify-center active:opacity-80"
                            >
                                <Pencil size={18} color={isDark ? '#d1d5db' : '#4b5563'} />
                            </Pressable>
                        </View>
                    </View>

                    {/* Account Management Section */}
                    <SettingsSectionHeader title={t('settings.accountManagement')} isDark={isDark} />
                    <View style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', borderColor: isDark ? '#374151' : '#f3f4f6' }} className="mx-4 rounded-2xl overflow-hidden border shadow-sm">
                        <SettingsItem
                            icon={CreditCard}
                            iconColor="#2563eb"
                            iconBg="#eff6ff"
                            title={t('settings.financialAccounts')}
                            subtitle={t('settings.financialAccountsDesc')}
                            onPress={() => setAccountModalVisible(true)}
                            isDark={isDark}
                        />
                        <View style={{ backgroundColor: isDark ? '#374151' : '#f9fafb' }} className="h-px ml-[72px]" />
                        <SettingsItem
                            icon={Tags}
                            iconColor="#059669"
                            iconBg="#ecfdf5"
                            title={t('settings.categories')}
                            subtitle={t('settings.categoriesDesc')}
                            onPress={() => setCategoryModalVisible(true)}
                            isDark={isDark}
                        />
                        <View style={{ backgroundColor: isDark ? '#374151' : '#f9fafb' }} className="h-px ml-[72px]" />
                        <SettingsItem
                            icon={Users}
                            iconColor="#8b5cf6"
                            iconBg="#f5f3ff"
                            title={t('settings.familyManagement')}
                            subtitle={t('settings.familyMembersDesc')}
                            onPress={() => setFamilyModalVisible(true)}
                            isDark={isDark}
                        />
                    </View>

                    {/* Preferences Section */}
                    <SettingsSectionHeader title={t('settings.preferences')} isDark={isDark} />
                    <View style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', borderColor: isDark ? '#374151' : '#f3f4f6' }} className="mx-4 rounded-2xl overflow-hidden border shadow-sm">
                        <SettingsItem
                            icon={Bell}
                            iconColor="#f59e0b"
                            iconBg="#fffbeb"
                            title={t('settings.notifications')}
                            subtitle={t('settings.pushNotifications')}
                            onPress={() => {
                                const newVal = !notificationsEnabled;
                                setNotificationsEnabled(newVal);
                                savePreference('notifications', newVal);
                            }}
                            isDark={isDark}
                            rightElement={
                                <Switch
                                    value={notificationsEnabled}
                                    onValueChange={(val) => {
                                        setNotificationsEnabled(val);
                                        savePreference('notifications', val);
                                    }}
                                    trackColor={{ false: isDark ? '#374151' : '#e2e8f0', true: "#3b82f6" }}
                                    thumbColor="#ffffff"
                                />
                            }
                        />
                        <View style={{ backgroundColor: isDark ? '#374151' : '#f9fafb' }} className="h-px ml-[72px]" />
                        <SettingsItem
                            icon={Palette}
                            iconColor="#ec4899"
                            iconBg="#fdf2f8"
                            title={t('settings.appearance')}
                            subtitle={themeLabel}
                            onPress={() => setShowThemeModal(true)}
                            isDark={isDark}
                        />
                        <View style={{ backgroundColor: isDark ? '#374151' : '#f9fafb' }} className="h-px ml-[72px]" />
                        <SettingsItem
                            icon={Globe}
                            iconColor="#14b8a6"
                            iconBg="#ccfbf1"
                            title={t('settings.language')}
                            subtitle={langLabel}
                            onPress={() => setShowLanguageModal(true)}
                            isDark={isDark}
                        />
                    </View>

                    {/* Support Section */}
                    <SettingsSectionHeader title={t('settings.support')} isDark={isDark} />
                    <View style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', borderColor: isDark ? '#374151' : '#f3f4f6' }} className="mx-4 rounded-2xl overflow-hidden border shadow-sm">
                        <SettingsItem
                            icon={HelpCircle}
                            iconColor="#6366f1"
                            iconBg="#eef2ff"
                            title={t('settings.helpFaq')}
                            onPress={() => showSupportInfo('help')}
                            isDark={isDark}
                        />
                        <View style={{ backgroundColor: isDark ? '#374151' : '#f9fafb' }} className="h-px ml-[72px]" />
                        <SettingsItem
                            icon={Shield}
                            iconColor="#10b981"
                            iconBg="#ecfdf5"
                            title={t('settings.privacyPolicy')}
                            onPress={() => showSupportInfo('privacy')}
                            isDark={isDark}
                        />
                        <View style={{ backgroundColor: isDark ? '#374151' : '#f9fafb' }} className="h-px ml-[72px]" />
                        <SettingsItem
                            icon={Smartphone}
                            iconColor="#64748b"
                            iconBg="#f1f5f9"
                            title={t('settings.appVersion')}
                            subtitle="1.0.0 (Build 124)"
                            isDark={isDark}
                            rightElement={<Text style={{ color: isDark ? '#6b7280' : '#9ca3af' }} className="text-xs font-medium">v1.0.0</Text>}
                        />
                    </View>

                    {/* Sign Out */}
                    <View className="mx-4 mt-8">
                        <Pressable
                            onPress={handleLogout}
                            disabled={isLoggingOut}
                            style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', borderColor: isDark ? '#7f1d1d' : '#fee2e2' }}
                            className={cn(
                                "border rounded-2xl p-4 flex-row items-center justify-center gap-3 shadow-sm",
                                isDark ? "active:bg-red-900/30" : "active:bg-red-50",
                                isLoggingOut && "opacity-50"
                            )}
                        >
                            {isLoggingOut ? (
                                <ActivityIndicator color="#dc2626" />
                            ) : (
                                <>
                                    <LogOut size={20} color="#dc2626" />
                                    <Text className="font-bold text-red-600 text-[15px]">{t('settings.signOut')}</Text>
                                </>
                            )}
                        </Pressable>
                    </View>

                    {/* Footer */}
                    <View className="items-center mt-8 mb-4">
                        <Text style={{ color: isDark ? '#6b7280' : '#9ca3af' }} className="text-xs font-medium">Morfosis Mobile</Text>
                    </View>
                </ScrollView>

                {/* Modals */}
                <FamilyManagementModal
                    visible={familyModalVisible}
                    onClose={() => setFamilyModalVisible(false)}
                    currentUserId={user?.id}
                    onFamilyUpdated={fetchUser}
                />

                <AccountManagementModal
                    visible={accountModalVisible}
                    onClose={() => setAccountModalVisible(false)}
                    onAccountsUpdated={fetchUser}
                />

                <CategoryManagementModal
                    visible={categoryModalVisible}
                    onClose={() => setCategoryModalVisible(false)}
                />

                <EditProfileModal
                    visible={editProfileModalVisible}
                    onClose={() => setEditProfileModalVisible(false)}
                    onSuccess={(u) => { setUser(u); setEditProfileModalVisible(false); }}
                    currentUser={user}
                />

                <SelectionModal
                    visible={showThemeModal}
                    title={t('theme.title')}
                    onClose={() => setShowThemeModal(false)}
                    selectedValue={themeMode}
                    onSelect={(val) => setThemeMode(val as ThemeMode)}
                    options={[
                        { label: t('theme.system'), value: "system", description: t('theme.systemDesc') },
                        { label: t('theme.light'), value: "light" },
                        { label: t('theme.dark'), value: "dark" },
                    ]}
                    isDark={isDark}
                />

                <SelectionModal
                    visible={showLanguageModal}
                    title={t('language.title')}
                    onClose={() => setShowLanguageModal(false)}
                    selectedValue={language}
                    onSelect={(val) => setLanguage(val as LanguageCode)}
                    options={[
                        { label: t('language.en'), value: "en" },
                        { label: t('language.id'), value: "id" },
                    ]}
                    isDark={isDark}
                />

                <InfoModal
                    visible={infoModal.visible}
                    title={infoModal.title}
                    content={infoModal.content}
                    onClose={() => setInfoModal({ ...infoModal, visible: false })}
                    isDark={isDark}
                />
            </SafeAreaView>
        </View>
    );
}

