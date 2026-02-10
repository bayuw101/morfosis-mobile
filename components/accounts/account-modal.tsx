import { View, Text, Modal, Pressable, ScrollView, TextInput, ActivityIndicator, Image, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { X, Plus, Wallet, Landmark, Banknote, TrendingUp, Check, Search, ChevronUp, ChevronDown, Pencil, Trash2, GripVertical, CreditCard } from "lucide-react-native";
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { API_URL } from "../../constants/config";
import { cn } from "../../lib/utils";
import { getAuthHeader } from "../../lib/auth";

// Account Types Configuration
const ACCOUNT_TYPES = [
    { type: 'bank', label: 'Bank', icon: Landmark, color: '#3b82f6', bgColor: '#dbeafe' },
    { type: 'e-wallet', label: 'E-Wallet', icon: Wallet, color: '#8b5cf6', bgColor: '#ede9fe' },
    { type: 'cash', label: 'Cash', icon: Banknote, color: '#22c55e', bgColor: '#dcfce7' },
    { type: 'investment', label: 'Investment', icon: TrendingUp, color: '#f59e0b', bgColor: '#fef3c7' },
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



    const fetchAccounts = useCallback(async () => {
        try {
            const headers = await getAuthHeader();
            const [accRes, logoRes] = await Promise.all([
                fetch(`${API_URL}/mobile/accounts?t=${Date.now()}`, { headers }),
                fetch(`${API_URL}/mobile/accounts/logos`, { headers })
            ]);

            if (accRes.ok) {
                const data = await accRes.json();
                // Handle both array and { accounts: [...] } response formats
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
            Alert.alert("Error", "Please enter an account name");
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
                Alert.alert("Error", err.error || "Failed to save account");
            }
        } catch (e) {
            Alert.alert("Error", "Network error");
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
                Alert.alert("Error", err.error || "Failed to delete account");
            }
        } catch (e) {
            Alert.alert("Error", "Network error");
        } finally {
            setIsSaving(false);
        }
    };

    const requestDelete = () => {
        setConfirmConfig({
            visible: true,
            title: "Delete Account?",
            message: "This will delete the account. Transactions will be preserved but unlinked.",
            actionLabel: "Delete",
            isDestructive: true,
            onConfirm: executeDelete
        });
    };

    const handleDragEnd = async ({ data }: { data: Account[] }) => {
        setAccounts(data); // Optimistic

        try {
            const headers = {
                ...(await getAuthHeader()),
                'Content-Type': 'application/json'
            };
            // Prepare updates: server expects { updates: [{ id, sort_order }] } or similar
            // But based on existing code in Category Manager it was { updates }
            // Let's match typical pattern: send item ID and new index
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
            fetchAccounts(); // Revert
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
            <View className="h-7 w-48 bg-gray-200 rounded-lg mb-6" />
            <View className="bg-gray-100 rounded-2xl p-4 mb-6">
                <View className="h-4 w-24 bg-gray-200 rounded mb-2" />
                <View className="h-6 w-32 bg-gray-200 rounded" />
            </View>
            {[1, 2, 3].map(i => (
                <View key={i} className="bg-gray-50 rounded-2xl p-4 mb-3 flex-row items-center">
                    <View className="h-12 w-12 bg-gray-200 rounded-2xl mr-3" />
                    <View className="flex-1">
                        <View className="h-4 w-28 bg-gray-200 rounded mb-1" />
                        <View className="h-3 w-20 bg-gray-100 rounded" />
                    </View>
                </View>
            ))}
        </View>
    );

    const renderListView = () => (
        <View className="flex-1">
            <View className="flex-row items-center justify-between mb-5">
                <Text className="text-xl font-bold text-gray-900">Account Manager</Text>
                <Pressable
                    onPress={handleNewAccount}
                    className="bg-gray-100 p-2 rounded-full"
                >
                    <Plus size={20} color="#374151" />
                </Pressable>
            </View>

            {/* Total Balance Card */}
            <View className="bg-gray-900 rounded-2xl p-4 mb-5">
                <Text className="text-gray-400 text-xs font-medium mb-1">Total Balance</Text>
                <Text className="text-white text-2xl font-bold">{formatCurrency(totalBalance)}</Text>
                <Text className="text-gray-500 text-xs mt-1">{accounts.length} accounts</Text>
            </View>

            {/* Accounts List */}
            <View className="flex-1">
                <DraggableFlatList
                    data={accounts}
                    onDragEnd={handleDragEnd}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    renderItem={({ item, drag, isActive }) => {
                        const typeConfig = ACCOUNT_TYPES.find(t => t.type === item.type) || ACCOUNT_TYPES[0];
                        const Icon = typeConfig.icon;

                        return (
                            <TouchableOpacity
                                onLongPress={drag}
                                disabled={isActive}
                                onPress={() => handleEditAccount(item)}
                                activeOpacity={0.7}
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: 16,
                                    borderWidth: 1,
                                    borderColor: isActive ? '#3b82f6' : '#f3f4f6',
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
                                    <GripVertical size={20} color="#9ca3af" />
                                </View>

                                {/* Logo / Icon */}
                                <View
                                    className="h-12 w-12 rounded-2xl items-center justify-center mr-3"
                                    style={{ backgroundColor: typeConfig.bgColor }}
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
                                    <Text className="font-bold text-gray-900 text-[15px]" numberOfLines={1}>{item.name}</Text>
                                    <Text className="text-xs text-gray-500 capitalize">{item.type.replace('-', ' ')}</Text>
                                </View>

                                {/* Balance (Hide in reorder mode to reduce clutter, or keep it) */}
                                <Text className="font-bold text-gray-900 text-sm">{formatCurrency(item.current_balance)}</Text>
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
                    <Pressable onPress={() => { setView("list"); resetForm(); }} className="mr-3 bg-gray-100 p-2 rounded-full">
                        <X size={16} color="black" />
                    </Pressable>
                    <Text className="text-xl font-bold text-gray-900 flex-1">
                        {isEditing ? "Edit Account" : "New Account"}
                    </Text>
                    {isEditing && (
                        <Pressable onPress={requestDelete} className="bg-red-50 p-2 rounded-full">
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
                        <Text className="text-sm font-bold text-gray-700 mb-2">Account Name</Text>
                        <TextInput
                            className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900"
                            placeholder="e.g. BCA Savings"
                            placeholderTextColor="#9ca3af"
                            value={formName}
                            onChangeText={setFormName}
                        />
                    </View>

                    {/* Account Type */}
                    <View className="mb-5">
                        <Text className="text-sm font-bold text-gray-700 mb-2">Account Type</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {ACCOUNT_TYPES.map(type => {
                                const Icon = type.icon;
                                const isSelected = formType === type.type;
                                return (
                                    <Pressable
                                        key={type.type}
                                        onPress={() => setFormType(type.type)}
                                        className={cn(
                                            "flex-row items-center gap-2 px-4 py-3 rounded-xl border",
                                            isSelected ? "bg-gray-900 border-gray-900" : "bg-white border-gray-200"
                                        )}
                                    >
                                        <Icon size={16} color={isSelected ? "#ffffff" : type.color} />
                                        <Text className={cn("font-semibold text-sm", isSelected ? "text-white" : "text-gray-700")}>
                                            {type.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>

                    {/* Initial Balance */}
                    <View className="mb-5">
                        <Text className="text-sm font-bold text-gray-700 mb-2">
                            {isEditing ? "Current Balance" : "Initial Balance"}
                        </Text>
                        <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4">
                            <Text className="text-gray-500 font-medium mr-2">Rp</Text>
                            <TextInput
                                className="flex-1 py-4 text-gray-900 text-lg font-bold"
                                placeholder="0"
                                placeholderTextColor="#9ca3af"
                                keyboardType="numeric"
                                value={formBalance ? new Intl.NumberFormat('id-ID').format(parseFloat(formBalance) || 0) : ""}
                                onChangeText={(t) => {
                                    const val = t.replace(/\D/g, "");
                                    setFormBalance(val);
                                }}
                            />
                        </View>
                    </View>

                    {/* Logo Selection */}
                    <View className="mb-5">
                        <Text className="text-sm font-bold text-gray-700 mb-2">Logo (Optional)</Text>

                        {/* Search */}
                        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-2.5 mb-3">
                            <Search size={16} color="#9ca3af" />
                            <TextInput
                                className="flex-1 ml-2 text-gray-900 text-sm"
                                placeholder="Search logos..."
                                placeholderTextColor="#9ca3af"
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
                                    className={cn(
                                        "h-14 w-14 rounded-xl items-center justify-center border-2",
                                        formLogo === null ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-gray-50"
                                    )}
                                >
                                    <X size={18} color={formLogo === null ? "#2563eb" : "#9ca3af"} />
                                </Pressable>

                                {filteredLogos.slice(0, 20).map(logo => (
                                    <Pressable
                                        key={logo.value}
                                        onPress={() => setFormLogo(logo.filename)}
                                        className={cn(
                                            "h-14 w-14 rounded-xl items-center justify-center border-2 bg-white",
                                            formLogo === logo.filename ? "border-blue-500" : "border-gray-200"
                                        )}
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
                    className={cn(
                        "w-full h-14 rounded-2xl items-center justify-center mt-4",
                        isSaving || !formName.trim() ? "bg-gray-300" : "bg-gray-900"
                    )}
                >
                    {isSaving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-[16px]">
                            {isEditing ? "Save Changes" : "Create Account"}
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
                        <View className="bg-white rounded-t-[32px] p-6 pb-10 h-[80%]">
                            {/* iOS-style handle */}
                            <View className="w-10 h-1 bg-gray-300 rounded-full self-center mb-6" />

                            {isLoading ? renderSkeleton() : (
                                <>
                                    {view === 'list' && renderListView()}
                                    {(view === 'create' || view === 'edit') && renderFormView()}
                                </>
                            )}

                            {/* Loading Overlay */}
                            {isSaving && (
                                <View className="absolute inset-0 bg-white/80 items-center justify-center z-50 rounded-t-[32px]">
                                    <View className="bg-white p-6 rounded-2xl shadow-lg items-center">
                                        <ActivityIndicator size="large" color="#2563eb" />
                                        <Text className="text-sm font-medium text-gray-600 mt-3">Please wait...</Text>
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
                        <View className="bg-white p-6 rounded-3xl w-full shadow-xl">
                            <Text className="text-lg font-bold text-gray-900 mb-2">{confirmConfig.title}</Text>
                            <Text className="text-gray-500 mb-6">{confirmConfig.message}</Text>
                            <View className="flex-row gap-3">
                                <Pressable
                                    className="flex-1 bg-gray-100 p-3 rounded-xl items-center"
                                    onPress={() => setConfirmConfig(null)}
                                >
                                    <Text className="font-bold text-gray-700">Cancel</Text>
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
