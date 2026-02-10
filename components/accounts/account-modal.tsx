import { View, Text, Modal, Pressable, ScrollView, TextInput, ActivityIndicator, Image, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { X, Plus, Wallet, Landmark, Banknote, TrendingUp, Check, Search, ChevronUp, ChevronDown, Pencil, Trash2, GripVertical, CreditCard } from "lucide-react-native";
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { API_URL } from "../../constants/config";
import { cn } from "../../lib/utils";
import { getAuthHeader } from "../../lib/auth";
import { useTheme } from "../../context/theme-context";
import { useLanguage } from "../../context/language-context";

// Account Types Configuration
const ACCOUNT_TYPES = [
    { type: 'bank', labelKey: 'accountTypes.bank', icon: Landmark, color: '#3b82f6', bgColor: '#dbeafe', bgColorDark: '#1e3a5f' },
    { type: 'e-wallet', labelKey: 'accountTypes.ewallet', icon: Wallet, color: '#8b5cf6', bgColor: '#ede9fe', bgColorDark: '#312e81' },
    { type: 'cash', labelKey: 'accountTypes.cash', icon: Banknote, color: '#22c55e', bgColor: '#dcfce7', bgColorDark: '#14532d' },
    { type: 'investment', labelKey: 'accountTypes.investment', icon: TrendingUp, color: '#f59e0b', bgColor: '#fef3c7', bgColorDark: '#451a03' },
];

interface Account {
    id: string;
    name: string;
    type: string;
    current_balance: number;
    logo?: string | null;
    sort_order: number;
}

interface LogoOption {
    value: string;
    label: string;
    filename: string;
}

interface AccountModalProps {
    visible: boolean;
    onClose: () => void;
    onAccountsUpdated?: () => void;
}

export function AccountManagementModal({ visible, onClose, onAccountsUpdated }: AccountModalProps) {
    const { isDark } = useTheme();
    const { t } = useLanguage();
    const [view, setView] = useState<"list" | "create" | "edit">("list");
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [formName, setFormName] = useState("");
    const [formType, setFormType] = useState("bank");
    const [formBalance, setFormBalance] = useState("");
    const [formLogo, setFormLogo] = useState<string | null>(null);

    // Logo options
    const [logoOptions, setLogoOptions] = useState<LogoOption[]>([]);
    const [logoSearch, setLogoSearch] = useState("");

    // Confirm dialog
    const [confirmConfig, setConfirmConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        actionLabel: string;
        isDestructive?: boolean;
        onConfirm: () => Promise<void> | void;
    } | null>(null);

    // Theme colors
    const sheetBg = isDark ? '#1f2937' : '#ffffff';
    const cardBg = isDark ? '#374151' : '#ffffff';
    const cardBorder = isDark ? '#4b5563' : '#f3f4f6';
    const titleColor = isDark ? '#f9fafb' : '#111827';
    const labelColor = isDark ? '#9ca3af' : '#6b7280';
    const textColor = isDark ? '#d1d5db' : '#374151';
    const inputBg = isDark ? '#374151' : '#f9fafb';
    const inputBorder = isDark ? '#4b5563' : '#e5e7eb';
    const handleColor = isDark ? '#4b5563' : '#d1d5db';
    const skeletonBg = isDark ? '#374151' : '#e5e7eb';
    const skeletonLight = isDark ? '#4b5563' : '#f3f4f6';
    const closeBtnBg = isDark ? '#374151' : '#f3f4f6';
    const closeIconColor = isDark ? '#d1d5db' : '#374151';

    const fetchAccounts = useCallback(async () => {
        try {
            const headers = await getAuthHeader();
            const [accRes, logoRes] = await Promise.all([
                fetch(`${API_URL}/mobile/accounts?t=${Date.now()}`, { headers }),
                fetch(`${API_URL}/mobile/accounts/logos`, { headers })
            ]);

            if (accRes.ok) {
                const data = await accRes.json();
                const accountsList = Array.isArray(data) ? data : (data.accounts || []);
                setAccounts(accountsList.sort((a: Account, b: Account) => (a.sort_order || 0) - (b.sort_order || 0)));
            }
            if (logoRes.ok) {
                setLogoOptions(await logoRes.json());
            }
        } catch (e) {
            console.error("Failed to fetch accounts:", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (visible) {
            setIsLoading(true);
            setView("list");
            fetchAccounts();
        }
    }, [visible, fetchAccounts]);

    const resetForm = () => {
        setFormName("");
        setFormType("bank");
        setFormBalance("");
        setFormLogo(null);
        setEditingAccount(null);
        setLogoSearch("");
    };

    const handleNewAccount = () => {
        resetForm();
        setView("create");
    };

    const handleEditAccount = (account: Account) => {
        setEditingAccount(account);
        setFormName(account.name);
        setFormType(account.type);
        setFormBalance(account.current_balance.toString());
        setFormLogo(account.logo || null);
        setView("edit");
    };

    const handleSave = async () => {
        if (!formName.trim()) {
            Alert.alert(t('common.error'), t('accountManager.enterAccountName'));
            return;
        }

        setIsSaving(true);
        try {
            const headers = {
                ...(await getAuthHeader()),
                'Content-Type': 'application/json'
            };

            const payload = {
                name: formName.trim(),
                type: formType,
                current_balance: parseFloat(formBalance) || 0,
                logo: formLogo
            };

            let res;
            if (editingAccount) {
                res = await fetch(`${API_URL}/mobile/accounts/${editingAccount.id}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch(`${API_URL}/mobile/accounts`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                await fetchAccounts();
                setView("list");
                resetForm();
                if (onAccountsUpdated) onAccountsUpdated();
            } else {
                const err = await res.json();
                Alert.alert(t('common.error'), err.error || t('accountManager.failedSave'));
            }
        } catch (e) {
            Alert.alert(t('common.error'), t('accountManager.networkError'));
        } finally {
            setIsSaving(false);
        }
    };

    const executeDelete = async () => {
        if (!editingAccount) return;
        setIsSaving(true);
        try {
            const headers = await getAuthHeader();
            const res = await fetch(`${API_URL}/mobile/accounts/${editingAccount.id}`, {
                method: 'DELETE',
                headers
            });
            if (res.ok) {
                await fetchAccounts();
                setView("list");
                resetForm();
                if (onAccountsUpdated) onAccountsUpdated();
            } else {
                const err = await res.json();
                Alert.alert(t('common.error'), err.error || t('accountManager.failedDelete'));
            }
        } catch (e) {
            Alert.alert(t('common.error'), t('accountManager.networkError'));
        } finally {
            setIsSaving(false);
        }
    };

    const requestDelete = () => {
        setConfirmConfig({
            visible: true,
            title: t('accountManager.deleteAccount'),
            message: t('accountManager.deleteAccountMsg'),
            actionLabel: t('common.delete'),
            isDestructive: true,
            onConfirm: executeDelete
        });
    };

    const handleDragEnd = async ({ data }: { data: Account[] }) => {
        setAccounts(data);

        try {
            const headers = {
                ...(await getAuthHeader()),
                'Content-Type': 'application/json'
            };
            const updates = data.map((acc, index) => ({
                id: acc.id,
                sort_order: index
            }));

            await fetch(`${API_URL}/mobile/accounts/reorder`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ items: updates })
            });

            if (onAccountsUpdated) onAccountsUpdated();
        } catch (e) {
            console.error("Reorder failed:", e);
            fetchAccounts();
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0
        }).format(amount);
    };

    const totalBalance = accounts.reduce((sum, acc) => sum + (Number(acc.current_balance) || 0), 0);
    const filteredLogos = logoSearch
        ? logoOptions.filter(l => l.label.toLowerCase().includes(logoSearch.toLowerCase()))
        : logoOptions;
    const BASE_URL = API_URL.replace('/api', '');

    const renderSkeleton = () => (
        <View>
            <View style={{ backgroundColor: skeletonBg }} className="h-7 w-48 rounded-lg mb-6" />
            <View style={{ backgroundColor: skeletonLight }} className="rounded-2xl p-4 mb-6">
                <View style={{ backgroundColor: skeletonBg }} className="h-4 w-24 rounded mb-2" />
                <View style={{ backgroundColor: skeletonBg }} className="h-6 w-32 rounded" />
            </View>
            {[1, 2, 3].map(i => (
                <View key={i} style={{ backgroundColor: skeletonLight }} className="rounded-2xl p-4 mb-3 flex-row items-center">
                    <View style={{ backgroundColor: skeletonBg }} className="h-12 w-12 rounded-2xl mr-3" />
                    <View className="flex-1">
                        <View style={{ backgroundColor: skeletonBg }} className="h-4 w-28 rounded mb-1" />
                        <View style={{ backgroundColor: skeletonLight }} className="h-3 w-20 rounded" />
                    </View>
                </View>
            ))}
        </View>
    );

    const renderListView = () => (
        <View className="flex-1">
            <View className="flex-row items-center justify-between mb-5">
                <Text style={{ color: titleColor }} className="text-xl font-bold">{t('accountManager.title')}</Text>
                <Pressable
                    onPress={handleNewAccount}
                    style={{ backgroundColor: closeBtnBg }}
                    className="p-2 rounded-full"
                >
                    <Plus size={20} color={closeIconColor} />
                </Pressable>
            </View>

            {/* Total Balance Card */}
            <View style={{ backgroundColor: isDark ? '#111827' : '#111827' }} className="rounded-2xl p-4 mb-5">
                <Text className="text-gray-400 text-xs font-medium mb-1">{t('accountManager.totalBalance')}</Text>
                <Text className="text-white text-2xl font-bold">{formatCurrency(totalBalance)}</Text>
                <Text className="text-gray-500 text-xs mt-1">{accounts.length} {t('accountManager.accounts')}</Text>
            </View>

            {/* Accounts List */}
            <View className="flex-1">
                <DraggableFlatList
                    data={accounts}
                    onDragEnd={handleDragEnd}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    renderItem={({ item, drag, isActive }) => {
                        const typeConfig = ACCOUNT_TYPES.find(tc => tc.type === item.type) || ACCOUNT_TYPES[0];
                        const Icon = typeConfig.icon;

                        return (
                            <TouchableOpacity
                                onLongPress={drag}
                                disabled={isActive}
                                onPress={() => handleEditAccount(item)}
                                activeOpacity={0.7}
                                style={{
                                    backgroundColor: isDark ? '#374151' : '#ffffff',
                                    borderRadius: 16,
                                    borderWidth: 1,
                                    borderColor: isActive ? '#3b82f6' : (isDark ? '#4b5563' : '#f3f4f6'),
                                    padding: 16,
                                    marginBottom: 12,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    elevation: isActive ? 4 : 0,
                                    zIndex: isActive ? 10 : 0,
                                }}
                            >
                                {/* Grip Handle */}
                                <View className="mr-3">
                                    <GripVertical size={20} color={isDark ? '#6b7280' : '#9ca3af'} />
                                </View>

                                {/* Logo / Icon */}
                                <View
                                    className="h-12 w-12 rounded-2xl items-center justify-center mr-3"
                                    style={{ backgroundColor: isDark ? typeConfig.bgColorDark : typeConfig.bgColor }}
                                >
                                    {item.logo ? (
                                        <Image
                                            source={{ uri: `${BASE_URL}/bank-logo/${item.logo}` }}
                                            style={{ width: 26, height: 26 }}
                                            resizeMode="contain"
                                        />
                                    ) : (
                                        <Icon size={22} color={typeConfig.color} />
                                    )}
                                </View>

                                {/* Name & Type */}
                                <View className="flex-1">
                                    <Text style={{ color: titleColor }} className="font-bold text-[15px]" numberOfLines={1}>{item.name}</Text>
                                    <Text style={{ color: labelColor }} className="text-xs capitalize">{item.type.replace('-', ' ')}</Text>
                                </View>

                                {/* Balance */}
                                <Text style={{ color: titleColor }} className="font-bold text-sm">{formatCurrency(item.current_balance)}</Text>
                            </TouchableOpacity>
                        );
                    }}
                    ListFooterComponent={<View className="h-4" />}
                />
            </View>
        </View>
    );

    const renderFormView = () => {
        const isEditing = view === "edit";

        return (
            <View>
                {/* Header */}
                <View className="flex-row items-center mb-6">
                    <Pressable onPress={() => { setView("list"); resetForm(); }} style={{ backgroundColor: closeBtnBg }} className="mr-3 p-2 rounded-full">
                        <X size={16} color={closeIconColor} />
                    </Pressable>
                    <Text style={{ color: titleColor }} className="text-xl font-bold flex-1">
                        {isEditing ? t('accountManager.editAccount') : t('accountManager.newAccount')}
                    </Text>
                    {isEditing && (
                        <Pressable onPress={requestDelete} style={{ backgroundColor: isDark ? '#451a1a' : '#fef2f2' }} className="p-2 rounded-full">
                            <Trash2 size={18} color="#ef4444" />
                        </Pressable>
                    )}
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={{ maxHeight: 400 }}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    keyboardDismissMode="interactive"
                >
                    {/* Account Name */}
                    <View className="mb-5">
                        <Text style={{ color: textColor }} className="text-sm font-bold mb-2">{t('accountManager.accountName')}</Text>
                        <TextInput
                            style={{ backgroundColor: inputBg, borderColor: inputBorder, color: titleColor }}
                            className="border rounded-xl p-4"
                            placeholder={t('accountManager.accountNamePlaceholder')}
                            placeholderTextColor={labelColor}
                            value={formName}
                            onChangeText={setFormName}
                        />
                    </View>

                    {/* Account Type */}
                    <View className="mb-5">
                        <Text style={{ color: textColor }} className="text-sm font-bold mb-2">{t('accountManager.accountType')}</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {ACCOUNT_TYPES.map(type => {
                                const Icon = type.icon;
                                const isSelected = formType === type.type;
                                return (
                                    <Pressable
                                        key={type.type}
                                        onPress={() => setFormType(type.type)}
                                        style={isSelected
                                            ? { backgroundColor: isDark ? '#3b82f6' : '#111827', borderColor: isDark ? '#3b82f6' : '#111827' }
                                            : { backgroundColor: isDark ? '#374151' : '#ffffff', borderColor: isDark ? '#4b5563' : '#e5e7eb' }
                                        }
                                        className="flex-row items-center gap-2 px-4 py-3 rounded-xl border"
                                    >
                                        <Icon size={16} color={isSelected ? "#ffffff" : type.color} />
                                        <Text style={{ color: isSelected ? '#ffffff' : textColor }} className="font-semibold text-sm">
                                            {t(type.labelKey)}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>

                    {/* Balance */}
                    <View className="mb-5">
                        <Text style={{ color: textColor }} className="text-sm font-bold mb-2">
                            {isEditing ? t('accountManager.currentBalance') : t('accountManager.initialBalance')}
                        </Text>
                        <View style={{ backgroundColor: inputBg, borderColor: inputBorder }} className="flex-row items-center border rounded-xl px-4">
                            <Text style={{ color: labelColor }} className="font-medium mr-2">Rp</Text>
                            <TextInput
                                className="flex-1 py-4 text-lg font-bold"
                                style={{ color: titleColor }}
                                placeholder="0"
                                placeholderTextColor={labelColor}
                                keyboardType="numeric"
                                value={formBalance ? new Intl.NumberFormat('id-ID').format(parseFloat(formBalance) || 0) : ""}
                                onChangeText={(txt) => {
                                    const val = txt.replace(/\D/g, "");
                                    setFormBalance(val);
                                }}
                            />
                        </View>
                    </View>

                    {/* Logo Selection */}
                    <View className="mb-5">
                        <Text style={{ color: textColor }} className="text-sm font-bold mb-2">{t('accountManager.logo')}</Text>

                        {/* Search */}
                        <View style={{ backgroundColor: isDark ? '#4b5563' : '#f3f4f6' }} className="flex-row items-center rounded-xl px-4 py-2.5 mb-3">
                            <Search size={16} color={isDark ? '#9ca3af' : '#9ca3af'} />
                            <TextInput
                                className="flex-1 ml-2 text-sm"
                                style={{ color: titleColor }}
                                placeholder={t('accountManager.searchLogos')}
                                placeholderTextColor={labelColor}
                                value={logoSearch}
                                onChangeText={setLogoSearch}
                            />
                        </View>

                        {/* Logo Grid */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View className="flex-row gap-2">
                                {/* No Logo Option */}
                                <Pressable
                                    onPress={() => setFormLogo(null)}
                                    style={{
                                        borderColor: formLogo === null ? '#3b82f6' : (isDark ? '#4b5563' : '#e5e7eb'),
                                        backgroundColor: formLogo === null ? (isDark ? '#1e3a5f' : '#eff6ff') : (isDark ? '#374151' : '#f9fafb')
                                    }}
                                    className="h-14 w-14 rounded-xl items-center justify-center border-2"
                                >
                                    <X size={18} color={formLogo === null ? "#2563eb" : (isDark ? '#6b7280' : '#9ca3af')} />
                                </Pressable>

                                {filteredLogos.slice(0, 20).map(logo => (
                                    <Pressable
                                        key={logo.value}
                                        onPress={() => setFormLogo(logo.filename)}
                                        style={{
                                            borderColor: formLogo === logo.filename ? '#3b82f6' : (isDark ? '#4b5563' : '#e5e7eb'),
                                            backgroundColor: isDark ? '#374151' : '#ffffff'
                                        }}
                                        className="h-14 w-14 rounded-xl items-center justify-center border-2"
                                    >
                                        <Image
                                            source={{ uri: `${BASE_URL}/bank-logo/${logo.filename}` }}
                                            style={{ width: 32, height: 32 }}
                                            resizeMode="contain"
                                        />
                                    </Pressable>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                </ScrollView>

                {/* Save Button */}
                <Pressable
                    onPress={handleSave}
                    disabled={isSaving || !formName.trim()}
                    style={{
                        backgroundColor: (isSaving || !formName.trim())
                            ? (isDark ? '#4b5563' : '#d1d5db')
                            : (isDark ? '#3b82f6' : '#111827')
                    }}
                    className="w-full h-14 rounded-2xl items-center justify-center mt-4"
                >
                    {isSaving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-[16px]">
                            {isEditing ? t('accountManager.saveChanges') : t('accountManager.createAccount')}
                        </Text>
                    )}
                </Pressable>
            </View>
        );
    };

    return (
        <>
            <Modal visible={visible} animationType="slide" transparent>
                <GestureHandlerRootView className="flex-1">
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        className="flex-1 justify-end bg-black/40"
                    >
                        <Pressable className="flex-1" onPress={onClose} />
                        <View style={{ backgroundColor: sheetBg }} className="rounded-t-[32px] p-6 pb-10 h-[80%]">
                            {/* iOS-style handle */}
                            <View style={{ backgroundColor: handleColor }} className="w-10 h-1 rounded-full self-center mb-6" />

                            {isLoading ? renderSkeleton() : (
                                <>
                                    {view === 'list' && renderListView()}
                                    {(view === 'create' || view === 'edit') && renderFormView()}
                                </>
                            )}

                            {/* Loading Overlay */}
                            {isSaving && (
                                <View style={{ backgroundColor: isDark ? 'rgba(17,24,39,0.8)' : 'rgba(255,255,255,0.8)' }} className="absolute inset-0 items-center justify-center z-50 rounded-t-[32px]">
                                    <View style={{ backgroundColor: sheetBg }} className="p-6 rounded-2xl shadow-lg items-center">
                                        <ActivityIndicator size="large" color="#2563eb" />
                                        <Text style={{ color: labelColor }} className="text-sm font-medium mt-3">{t('accountManager.pleaseWait')}</Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </KeyboardAvoidingView>
                </GestureHandlerRootView>
            </Modal>

            {/* Confirmation Modal */}
            {confirmConfig && (
                <Modal visible={!!confirmConfig} transparent animationType="fade">
                    <View className="flex-1 bg-black/50 items-center justify-center p-6">
                        <View style={{ backgroundColor: sheetBg }} className="p-6 rounded-3xl w-full shadow-xl">
                            <Text style={{ color: titleColor }} className="text-lg font-bold mb-2">{confirmConfig.title}</Text>
                            <Text style={{ color: labelColor }} className="mb-6">{confirmConfig.message}</Text>
                            <View className="flex-row gap-3">
                                <Pressable
                                    style={{ backgroundColor: closeBtnBg }}
                                    className="flex-1 p-3 rounded-xl items-center"
                                    onPress={() => setConfirmConfig(null)}
                                >
                                    <Text style={{ color: textColor }} className="font-bold">{t('common.cancel')}</Text>
                                </Pressable>
                                <Pressable
                                    className={cn("flex-1 p-3 rounded-xl items-center", confirmConfig.isDestructive ? "bg-red-600" : "bg-blue-600")}
                                    onPress={() => {
                                        confirmConfig.onConfirm();
                                        setConfirmConfig(null);
                                    }}
                                >
                                    <Text className="font-bold text-white">{confirmConfig.actionLabel}</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
        </>
    );
}
