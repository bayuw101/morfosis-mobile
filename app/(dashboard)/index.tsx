import { View, Text, ScrollView, Pressable, RefreshControl, Image, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowUpRight, ArrowDownLeft, ArrowRightLeft, Search, Receipt, X, Users, ChevronDown, Edit2, Filter, TrendingUp, TrendingDown, ChevronRight, Wallet, Landmark, Banknote, Target } from "lucide-react-native";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { cn } from "../../lib/utils";
import { API_URL } from "../../constants/config";
import { FamilyManagementModal } from "../../components/family/family-modal";
import { EditProfileModal } from "../../components/edit-profile-modal";
import { AccountManagementModal } from "../../components/accounts/account-modal";
import { useTransactionModal } from "../../context/transaction-modal-context";
import { useFamily } from "../../context/family-context";
import { useTheme } from "../../context/theme-context";
import { useLanguage } from "../../context/language-context";

// Safe auth header helper
import { getAuthHeader } from "../../lib/auth";
import { ScreenLoader } from "../../components/ui/loaders";
import { Button } from "../../components/ui/button";

const ACCOUNT_TYPES: Record<string, { label: string; color: string; bg: string }> = {
    'cash': { label: 'Cash', color: '#22c55e', bg: '#dcfce7' },
    'bank': { label: 'Bank', color: '#3b82f6', bg: '#dbeafe' },
    'credit': { label: 'Credit', color: '#f59e0b', bg: '#fef3c7' },
    'ewallet': { label: 'E-Wallet', color: '#8b5cf6', bg: '#ede9fe' },
    'e-wallet': { label: 'E-Wallet', color: '#8b5cf6', bg: '#ede9fe' },
    'investment': { label: 'Investment', color: '#06b6d4', bg: '#cffafe' },
};

export default function DashboardScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ openTransaction?: string }>();
    const insets = useSafeAreaInsets();
    const slideAnim = useRef(new Animated.Value(0)).current;

    // Use Global Transaction Modal Context
    const { openModal, lastRefresh } = useTransactionModal();
    // Use Global Family Context
    const { activeFamily, isSwitching } = useFamily();
    // Theme and Language
    const { isDark } = useTheme();
    const { t } = useLanguage();

    const [user, setUser] = useState<any>(null);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [budgets, setBudgets] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activePlan, setActivePlan] = useState<any>(null);
    const [familyModalVisible, setFamilyModalVisible] = useState(false);
    const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
    const [accountModalVisible, setAccountModalVisible] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isLoading) {
            Animated.spring(slideAnim, { toValue: 1, friction: 10, tension: 60, useNativeDriver: true }).start();
        }
    }, [isLoading]);

    const fetchData = useCallback(async () => {
        try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const storedUser = await AsyncStorage.getItem('user_data');
            if (storedUser) setUser(JSON.parse(storedUser));

            const headers = {
                ...(await getAuthHeader()),
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Expires': '0',
            };
            const [accRes, budRes, txRes] = await Promise.all([
                fetch(`${API_URL}/mobile/accounts?t=${Date.now()}`, { headers }),
                fetch(`${API_URL}/mobile/budgets?t=${Date.now()}`, { headers }),
                fetch(`${API_URL}/mobile/transactions?limit=5&t=${Date.now()}`, { headers })
            ]);

            if (accRes.ok) {
                const accData = await accRes.json();
                setAccounts(accData.accounts || accData || []);
            }
            if (budRes.ok) setBudgets(await budRes.json());
            if (txRes.ok) {
                const txData = await txRes.json();
                // Handle both straight array or paginated/wrapped response
                setTransactions(Array.isArray(txData) ? txData : (txData.data || txData.transactions || []));
            }

            const meRes = await fetch(`${API_URL}/mobile/users/me`, { headers });
            if (meRes.ok) {
                const freshUser = await meRes.json();
                setUser(freshUser);
                await AsyncStorage.setItem('user_data', JSON.stringify(freshUser));
            }
        } catch (e) {
            console.error("Dashboard fetch error:", e);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Fetch data on mount, when lastRefresh changes, or when activeFamily changes (and not switching)
    useEffect(() => {
        if (!isSwitching) fetchData();
    }, [fetchData, lastRefresh, activeFamily, isSwitching]);

    const totalBalance = Array.isArray(accounts) ? accounts.reduce((acc, curr) => acc + (Number(curr.current_balance) || 0), 0) : 0;

    const thisMonthStats = Array.isArray(transactions) ? transactions.reduce((acc, t) => {
        if (t.type === 'expense') acc.expense += Math.abs(Number(t.amount) || 0);
        if (t.type === 'income') acc.income += (Number(t.amount) || 0);
        return acc;
    }, { income: 0, expense: 0 }) : { income: 0, expense: 0 };

    useEffect(() => {
        const def = budgets.find((b: any) => b.is_default);
        if (def) setActivePlan(def);
        else if (budgets.length > 0) setActivePlan(budgets[0]);
        else setActivePlan(null);
    }, [budgets]);

    const planAmount = activePlan ? (Number(activePlan.amount) || 0) : 0;
    const planSpent = activePlan ? (Number(activePlan.spent) || 0) : 0;
    const planPercentage = planAmount > 0 ? Math.min((planSpent / planAmount) * 100, 100) : 0;
    const planRemaining = Math.max(planAmount - planSpent, 0);

    const onRefresh = useCallback(() => { setRefreshing(true); fetchData(); }, [fetchData]);
    const BASE_URL = API_URL.replace('/api', '');

    const formatCurrency = (value: number, compact = true) => {
        if (isNaN(value)) return "0";
        if (compact) {
            if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
        }
        return new Intl.NumberFormat('id-ID').format(value);
    };

    const getAccountTypeInfo = (type: string) => {
        return ACCOUNT_TYPES[type?.toLowerCase()] || { label: type || 'Other', color: '#6b7280', bg: '#f3f4f6' };
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    // Loading State
    if (isLoading) {
        return <ScreenLoader message="Loading dashboard..." />;
    }

    return (
        <View className="flex-1 bg-gray-900">
            {/* Dark Header Section */}
            <View style={{ paddingTop: insets.top }} className="bg-gray-900 px-6">
                {/* Top Row: User & Family */}
                <View className="flex-row items-center justify-between mb-5">
                    <Pressable onPress={() => setEditProfileModalVisible(true)} className="flex-row items-center gap-3 active:opacity-80">
                        <View className="h-12 w-12 bg-gray-700 rounded-full items-center justify-center overflow-hidden border-2 border-gray-600">
                            {user?.picture ? (
                                <Image source={{ uri: user.picture }} style={{ width: '100%', height: '100%' }} />
                            ) : (
                                <Text className="font-bold text-white text-lg">{user?.name?.charAt(0) || "U"}</Text>
                            )}
                        </View>
                        <View>
                            <Text className="text-gray-400 text-[10px] font-medium uppercase tracking-wider">{getGreeting()}</Text>
                            <View className="flex-row items-center gap-1.5">
                                <Text className="text-lg font-bold text-white">{user?.name?.split(' ')[0] || "User"}</Text>
                                <Edit2 size={11} color="#6b7280" />
                            </View>
                        </View>
                    </Pressable>

                    <Pressable
                        className="flex-row items-center bg-gray-800/80 border border-gray-700 rounded-full px-3 py-2 gap-2 active:bg-gray-700"
                        onPress={() => setFamilyModalVisible(true)}
                    >
                        <View className="h-5 w-5 rounded-full bg-blue-500/30 items-center justify-center">
                            <Users size={10} color="#60a5fa" />
                        </View>
                        <Text className="text-xs font-semibold text-gray-300">{activeFamily?.name || "My Family"}</Text>
                        <ChevronDown size={12} color="#6b7280" />
                    </Pressable>
                </View>

                {/* Main Stats Card - In Dark Area */}
                {activePlan ? (
                    /* Active Plan Display */
                    <View className="mb-4">
                        <View className="flex-row items-center gap-2 mb-3">
                            <View className="h-7 w-7 bg-blue-500/20 rounded-lg items-center justify-center">
                                <Target size={14} color="#60a5fa" />
                            </View>
                            <Text className="text-gray-400 text-xs font-medium uppercase tracking-wider">Active Plan</Text>
                            <View className="flex-1" />
                            <Text className="text-blue-400 font-bold text-sm">{activePlan.name}</Text>
                        </View>

                        <View className="bg-gray-800/60 rounded-2xl p-4 border border-gray-700/50">
                            {/* Balance Display */}
                            <View className="flex-row items-end justify-between mb-4">
                                <View>
                                    <Text className="text-gray-400 text-xs mb-1">Remaining Budget</Text>
                                    <Text className="text-3xl font-bold text-white">Rp {formatCurrency(planRemaining, false)}</Text>
                                </View>
                                <View className="items-end">
                                    <Text className={cn("text-2xl font-bold", planPercentage > 80 ? "text-red-400" : "text-emerald-400")}>
                                        {planPercentage.toFixed(0)}%
                                    </Text>
                                    <Text className="text-gray-500 text-[10px]">used</Text>
                                </View>
                            </View>

                            {/* Progress Bar */}
                            <View className="h-2 w-full bg-gray-700 rounded-full overflow-hidden mb-3">
                                <View
                                    className={cn("h-full rounded-full", planPercentage > 80 ? "bg-red-500" : "bg-blue-500")}
                                    style={{ width: `${planPercentage}%` }}
                                />
                            </View>

                            {/* Spent / Total */}
                            <View className="flex-row justify-between">
                                <Text className="text-gray-400 text-xs">Rp {formatCurrency(planSpent)} spent</Text>
                                <Text className="text-gray-400 text-xs">of Rp {formatCurrency(planAmount)}</Text>
                            </View>
                        </View>

                        {/* Quick Actions */}
                        <View className="flex-row gap-3 mt-4 mb-2">
                            <Button
                                label="Expense"
                                variant="ghost"
                                onPress={() => openModal('expense')}
                                leftIcon={<ArrowUpRight size={18} color="#f87171" strokeWidth={2.5} />}
                                className="flex-1 bg-red-500/20 border-red-500/30 rounded-xl py-3.5 h-auto text-red-400 font-bold"
                                textClassName="text-red-400 font-bold"
                            />
                            <Button
                                label="Transfer"
                                variant="ghost"
                                onPress={() => openModal('transfer')}
                                leftIcon={<ArrowRightLeft size={18} color="#60a5fa" strokeWidth={2} />}
                                className="flex-1 bg-blue-500/20 border-blue-500/30 rounded-xl py-3.5 h-auto text-blue-400 font-bold"
                                textClassName="text-blue-400 font-bold"
                            />
                        </View>
                    </View>
                ) : (
                    /* Balance Summary (No Plan) */
                    <View className="mb-4">
                        <View className="bg-gray-800/60 rounded-2xl p-5 border border-gray-700/50">
                            <Text className="text-gray-400 text-xs mb-1">Total Balance</Text>
                            <Text className="text-3xl font-bold text-white mb-4">Rp {formatCurrency(totalBalance, false)}</Text>

                            <View className="flex-row gap-4">
                                <View className="flex-1 bg-emerald-500/10 rounded-xl p-3">
                                    <View className="flex-row items-center gap-1.5 mb-1">
                                        <ArrowDownLeft size={12} color="#34d399" />
                                        <Text className="text-emerald-400 text-[10px] font-medium">Income</Text>
                                    </View>
                                    <Text className="text-white font-bold">+Rp {formatCurrency(thisMonthStats.income)}</Text>
                                </View>
                                <View className="flex-1 bg-red-500/10 rounded-xl p-3">
                                    <View className="flex-row items-center gap-1.5 mb-1">
                                        <ArrowUpRight size={12} color="#f87171" />
                                        <Text className="text-red-400 text-[10px] font-medium">Expenses</Text>
                                    </View>
                                    <Text className="text-white font-bold">-Rp {formatCurrency(thisMonthStats.expense)}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Quick Actions */}
                        <View className="flex-row gap-3 mt-4 mb-2">
                            <Button
                                label="Expense"
                                variant="ghost"
                                onPress={() => openModal('expense')}
                                leftIcon={<ArrowUpRight size={18} color="#f87171" strokeWidth={2.5} />}
                                className="flex-1 bg-red-500/20 border-red-500/30 rounded-xl py-3.5 h-auto text-red-400 font-bold"
                                textClassName="text-red-400 font-bold"
                            />
                            <Button
                                label="Transfer"
                                variant="ghost"
                                onPress={() => openModal('transfer')}
                                leftIcon={<ArrowRightLeft size={18} color="#60a5fa" strokeWidth={2} />}
                                className="flex-1 bg-blue-500/20 border-blue-500/30 rounded-xl py-3.5 h-auto text-blue-400 font-bold"
                                textClassName="text-blue-400 font-bold"
                            />
                        </View>
                    </View>
                )}
            </View>

            {/* Content Card - Slides Up */}
            <Animated.View
                style={{
                    flex: 1,
                    backgroundColor: isDark ? '#1f2937' : '#ffffff',
                    borderTopLeftRadius: 28,
                    borderTopRightRadius: 28,
                    overflow: 'hidden',
                    transform: [{
                        translateY: slideAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [50, 0]
                        })
                    }]
                }}
            >
                {/* iOS-style Handle */}
                <View className="items-center pt-3 pb-2">
                    <View style={{ backgroundColor: isDark ? '#4b5563' : '#d1d5db' }} className="w-10 h-1 rounded-full" />
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
                >
                    {/* Accounts Section */}
                    <View className="mb-5">
                        <View className="flex-row items-center justify-between px-5 mb-3">
                            <Text style={{ color: isDark ? '#f9fafb' : '#111827' }} className="text-base font-bold">{t('dashboard.myAccounts')}</Text>
                            <Pressable onPress={() => setAccountModalVisible(true)} className="flex-row items-center gap-1 active:opacity-70">
                                <Text className="text-blue-600 font-semibold text-xs">{t('common.manage')}</Text>
                                <ChevronRight size={14} color="#3b82f6" />
                            </Pressable>
                        </View>

                        {accounts.length > 0 ? (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
                                {accounts.slice(0, 4).map((acc, index) => {
                                    const typeInfo = getAccountTypeInfo(acc.type);
                                    const isDefault = index === 0;

                                    return (
                                        <Pressable key={acc.id} className="active:scale-[0.98]">
                                            <View className={cn(
                                                "w-40 p-4 rounded-2xl border relative overflow-hidden",
                                                isDefault
                                                    ? "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400 shadow-lg shadow-blue-500/30"
                                                    : (isDark ? "border-gray-700" : "border-gray-200")
                                            )} style={isDefault ? {
                                                backgroundColor: '#3b82f6',
                                                shadowColor: '#3b82f6',
                                                shadowOffset: { width: 0, height: 4 },
                                                shadowOpacity: 0.3,
                                                shadowRadius: 8,
                                                elevation: 8,
                                            } : { backgroundColor: isDark ? '#374151' : '#ffffff' }}>
                                                {/* Decorative elements for default account */}
                                                {isDefault && (
                                                    <>
                                                        <View className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
                                                        <View className="absolute bottom-0 left-0 w-16 h-16 bg-blue-700/30 rounded-full" />
                                                    </>
                                                )}

                                                <View className="flex-row items-center justify-between mb-3">
                                                    <View className={cn(
                                                        "h-9 w-9 rounded-xl items-center justify-center overflow-hidden",
                                                        isDefault ? "bg-white/20" : "bg-gray-100"
                                                    )}>
                                                        {acc.logo ? (
                                                            <Image source={{ uri: `${BASE_URL}/bank-logo/${acc.logo}` }} style={{ width: 24, height: 24 }} resizeMode="contain" />
                                                        ) : acc.type?.toLowerCase() === 'cash' ? (
                                                            <Banknote size={16} color={isDefault ? "#ffffff" : "#64748b"} />
                                                        ) : acc.type?.toLowerCase() === 'bank' ? (
                                                            <Landmark size={16} color={isDefault ? "#ffffff" : "#64748b"} />
                                                        ) : (
                                                            <Wallet size={16} color={isDefault ? "#ffffff" : "#64748b"} />
                                                        )}
                                                    </View>

                                                    {/* Default Badge with Star */}
                                                    {isDefault ? (
                                                        <View className="bg-white/20 px-2 py-1 rounded-full flex-row items-center gap-1">
                                                            <View className="h-3 w-3 rounded-full bg-yellow-400 items-center justify-center">
                                                                <Text className="text-[6px]">★</Text>
                                                            </View>
                                                            <Text className="text-white text-[9px] font-bold">Default</Text>
                                                        </View>
                                                    ) : (
                                                        <View style={{ backgroundColor: typeInfo.bg }} className="px-2 py-0.5 rounded-full">
                                                            <Text style={{ color: typeInfo.color }} className="text-[8px] font-bold">{typeInfo.label}</Text>
                                                        </View>
                                                    )}
                                                </View>

                                                <Text style={{ color: isDefault ? '#bfdbfe' : (isDark ? '#9ca3af' : '#6b7280') }} className="text-xs font-medium mb-0.5" numberOfLines={1}>
                                                    {acc.name}
                                                </Text>
                                                <Text style={{ color: isDefault ? '#ffffff' : (isDark ? '#f9fafb' : '#111827') }} className="font-bold text-base">
                                                    Rp {formatCurrency(Number(acc.current_balance) || 0)}
                                                </Text>
                                            </View>
                                        </Pressable>
                                    );
                                })}
                            </ScrollView>
                        ) : (
                            <View style={{ backgroundColor: isDark ? '#374151' : '#f9fafb', borderColor: isDark ? '#4b5563' : '#e5e7eb' }} className="mx-5 p-6 rounded-2xl border items-center">
                                <Wallet size={24} color={isDark ? '#6b7280' : '#9ca3af'} />
                                <Text style={{ color: isDark ? '#9ca3af' : '#6b7280' }} className="text-sm font-medium mt-2">{t('dashboard.noAccountsYet')}</Text>
                                <Button
                                    label={t('dashboard.addAccount')}
                                    onPress={() => setAccountModalVisible(true)}
                                    size="sm"
                                    className="mt-3 bg-gray-900 rounded-lg"
                                />
                            </View>
                        )}
                    </View>

                    {/* Recent Transactions */}
                    <View className="px-5">
                        <View className="flex-row items-center justify-between mb-3">
                            <Text style={{ color: isDark ? '#f9fafb' : '#111827' }} className="text-base font-bold">{t('dashboard.recentActivity')}</Text>
                            <Pressable
                                onPress={() => router.push('/(dashboard)/transactions')}
                                className="flex-row items-center gap-1 active:opacity-70"
                            >
                                <Text className="text-blue-600 font-semibold text-xs">{t('common.viewAll')}</Text>
                                <ChevronRight size={14} color="#3b82f6" />
                            </Pressable>
                        </View>

                        <View style={{ backgroundColor: isDark ? '#374151' : '#ffffff', borderColor: isDark ? '#4b5563' : '#e5e7eb' }} className="rounded-2xl border overflow-hidden">
                            {transactions.length > 0 ? transactions.slice(0, 5).map((tx, i) => (
                                <Pressable
                                    key={tx.id}
                                    style={{ borderBottomColor: isDark ? '#4b5563' : '#f3f4f6' }}
                                    className={cn("flex-row items-center p-4", isDark ? "active:bg-gray-600" : "active:bg-gray-50", i !== Math.min(transactions.length, 5) - 1 && "border-b")}
                                >
                                    <View className={cn(
                                        "h-10 w-10 rounded-xl items-center justify-center mr-3",
                                        tx.type === 'income' ? "bg-green-50" : (tx.type === 'transfer' ? "bg-blue-50" : "bg-red-50")
                                    )}>
                                        {tx.category?.icon ? (
                                            <Text className="text-lg">{tx.category.icon}</Text>
                                        ) : tx.type === 'income' ? (
                                            <ArrowDownLeft size={16} color="#22c55e" strokeWidth={2.5} />
                                        ) : tx.type === 'transfer' ? (
                                            <ArrowRightLeft size={16} color="#3b82f6" strokeWidth={2} />
                                        ) : (
                                            <ArrowUpRight size={16} color="#ef4444" strokeWidth={2.5} />
                                        )}
                                    </View>

                                    <View className="flex-1">
                                        <Text style={{ color: isDark ? '#f9fafb' : '#111827' }} className="font-semibold text-sm" numberOfLines={1}>
                                            {tx.description || tx.category?.name || t('transactions.transaction')}
                                        </Text>
                                        <Text style={{ color: isDark ? '#6b7280' : '#9ca3af' }} className="text-[11px] font-medium">
                                            {new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                        </Text>
                                    </View>

                                    <Text className={cn(
                                        "font-bold text-sm",
                                        tx.type === 'income' ? "text-green-600" : (tx.type === 'transfer' ? "text-blue-600" : (isDark ? "text-gray-100" : "text-gray-900"))
                                    )}>
                                        {tx.type === 'expense' ? "-" : (tx.type === 'income' ? "+" : "")}Rp {formatCurrency(Math.abs(Number(tx.amount) || 0))}
                                    </Text>
                                </Pressable>
                            )) : (
                                <View className="p-8 items-center">
                                    <View style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6' }} className="h-12 w-12 rounded-full items-center justify-center mb-3">
                                        <Receipt size={20} color={isDark ? '#6b7280' : '#9ca3af'} />
                                    </View>
                                    <Text style={{ color: isDark ? '#9ca3af' : '#6b7280' }} className="font-medium text-sm">{t('dashboard.noTransactionsYet')}</Text>
                                    <Text style={{ color: isDark ? '#6b7280' : '#9ca3af' }} className="text-xs text-center mt-1">{t('dashboard.startTracking')}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </Animated.View>

            {isMounted && familyModalVisible && (
                <FamilyManagementModal
                    visible={familyModalVisible}
                    onClose={() => setFamilyModalVisible(false)}
                    currentUserId={user?.id}
                    onFamilyUpdated={fetchData}
                />
            )}

            {isMounted && editProfileModalVisible && (
                <EditProfileModal
                    visible={editProfileModalVisible}
                    onClose={() => setEditProfileModalVisible(false)}
                    onSuccess={(updatedUser) => { setUser(updatedUser); setEditProfileModalVisible(false); }}
                    currentUser={user}
                />
            )}

            {isMounted && accountModalVisible && (
                <AccountManagementModal
                    visible={accountModalVisible}
                    onClose={() => setAccountModalVisible(false)}
                    onAccountsUpdated={fetchData}
                />
            )}
        </View>
    );
}
