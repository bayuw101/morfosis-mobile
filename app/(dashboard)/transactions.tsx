import { View, Text, ScrollView, Pressable, TextInput, RefreshControl, Image, ActivityIndicator, Modal, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowUpRight, ArrowDownLeft, Search, Receipt, X, Users, ChevronDown, Edit2, Filter, TrendingUp, TrendingDown } from "lucide-react-native";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { cn } from "../../lib/utils";
import { API_URL } from "../../constants/config";
import { FamilyManagementModal } from "../../components/family/family-modal";
import { EditProfileModal } from "../../components/edit-profile-modal";
import { TransactionItem } from "../../components/transactions/transaction-item";
import { FilterModal, FilterState } from "../../components/transactions/filter-modal";
import { useTransactionModal } from "../../context/transaction-modal-context";
import { getAuthHeader } from "../../lib/auth";
import { useFamily } from "../../context/family-context";
import { useTheme } from "../../context/theme-context";
import { useLanguage } from "../../context/language-context";

interface Transaction {
    id: string;
    amount: number;
    type: 'income' | 'expense' | 'transfer';
    description?: string;
    date: string;
    category?: { id: string; name: string; icon?: string; };
    account?: { id: string; name: string; };
    to_account?: { id: string; name: string; };
    plan_id?: string;
}

interface Plan {
    id: string;
    name: string;
}

interface DeleteConfirmState {
    visible: boolean;
    transaction: Transaction | null;
    impactMessage: string;
}

const formatCurrencyFull = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(value);
};

const formatCurrency = (value: number) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return new Intl.NumberFormat('id-ID').format(value);
};

const DateGroupHeader = ({ date, total, isDark }: { date: string; total: { income: number; expense: number }; isDark: boolean }) => {
    const dateObj = new Date(date);
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);
    let displayDate = dateObj.toDateString() === today.toDateString() ? 'Today' : dateObj.toDateString() === yesterday.toDateString() ? 'Yesterday' : dateObj.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    return (
        <View style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff' }} className="px-5 py-2.5 flex-row items-center justify-between">
            <Text style={{ color: isDark ? '#6b7280' : '#9ca3af' }} className="text-[10px] font-bold uppercase tracking-widest">{displayDate}</Text>
            <View className="flex-row items-center gap-2.5">
                {total.income > 0 && <View className="flex-row items-center gap-1"><TrendingUp size={10} color="#22c55e" /><Text className="text-[10px] font-bold text-green-600">+{formatCurrency(total.income)}</Text></View>}
                {total.expense > 0 && <View className="flex-row items-center gap-1"><TrendingDown size={10} color="#ef4444" /><Text className="text-[10px] font-bold text-red-500">-{formatCurrency(total.expense)}</Text></View>}
            </View>
        </View>
    );
};

export default function TransactionsScreen() {
    const router = useRouter();
    const { lastRefresh } = useTransactionModal();
    const { activeFamily, isSwitching } = useFamily();
    const { isDark } = useTheme();
    const { t } = useLanguage();
    const insets = useSafeAreaInsets();

    const [isMounted, setIsMounted] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 }); // Server-side summary
    const [plans, setPlans] = useState<Plan[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState<FilterState>({
        type: 'all',
        accountId: null,
        memberId: null,
        planId: null,
        dateRange: { start: null, end: null }
    });

    const [familyModalVisible, setFamilyModalVisible] = useState(false);
    const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({ visible: false, transaction: null, impactMessage: '' });

    useEffect(() => { setIsMounted(true); }, []);

    const fetchTransactions = useCallback(async (currentFilters: FilterState, queryStr: string) => {
        try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const storedUser = await AsyncStorage.getItem('user_data');
            if (storedUser) setUser(JSON.parse(storedUser));

            const headers = { ...(await getAuthHeader()), 'Cache-Control': 'no-cache' };
            const { type, planId, accountId, memberId, dateRange } = currentFilters;

            // Generate Query Params
            let query = `limit=50&t=${Date.now()}`;
            if (type && type !== 'all') query += `&type=${type}`;
            if (planId) query += `&plan_id=${planId}`;
            if (accountId) query += `&account_id=${accountId}`;
            if (memberId) query += `&member_id=${memberId}`;
            if (dateRange.start) query += `&start_date=${dateRange.start.toISOString().split('T')[0]}`;
            if (dateRange.end) query += `&end_date=${dateRange.end.toISOString().split('T')[0]}`;
            if (queryStr) query += `&q=${encodeURIComponent(queryStr)}`;

            // 1. Fetch Transactions List ONLY (Critical - Fast)
            // We set include_summary=false to skip the heavy summary calculation
            const txQuery = `${query}&include_summary=false`;
            const txRes = await fetch(`${API_URL}/mobile/transactions?${txQuery}`, { headers });

            if (txRes.ok) {
                const responseData = await txRes.json();
                if (Array.isArray(responseData.data)) {
                    setTransactions(responseData.data);

                    // Temporary local summary until server summary arrives
                    // This gives "almost correct" values immediately
                    if (summary.income === 0 && summary.expense === 0) {
                        const income = responseData.data.filter((t: Transaction) => t.type === 'income').reduce((s: number, t: Transaction) => s + Number(t.amount), 0);
                        const expense = responseData.data.filter((t: Transaction) => t.type === 'expense').reduce((s: number, t: Transaction) => s + Math.abs(Number(t.amount)), 0);
                        setSummary({ income, expense, balance: income - expense });
                    }
                }
            }

            // Unblock UI immediately after transactions are loaded
            setIsLoading(false);
            setRefreshing(false);

            // 2. Fetch True Summary (Async - Heavier) & Aux Data
            const summaryQuery = `${query}&only_summary=true`;
            Promise.all([
                fetch(`${API_URL}/mobile/transactions?${summaryQuery}`, { headers }),
                fetch(`${API_URL}/mobile/budgets?t=${Date.now()}`, { headers }),
                fetch(`${API_URL}/mobile/accounts?t=${Date.now()}`, { headers })
            ]).then(async ([sumRes, planRes, accRes]) => {
                if (sumRes.ok) {
                    const sumData = await sumRes.json();
                    if (sumData.summary) setSummary(sumData.summary);
                }
                if (planRes.ok) {
                    const plansData = await planRes.json();
                    setPlans(Array.isArray(plansData) ? plansData : (plansData.plans || plansData.budgets || []));
                }
                if (accRes.ok) {
                    const accData = await accRes.json();
                    setAccounts(accData.accounts || []);
                }
            }).catch(err => console.error("Aux fetch error:", err));

        } catch (e) {
            console.error(e);
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    const searchTimeout = useRef<NodeJS.Timeout | null>(null);
    useEffect(() => {
        if (!isMounted) return;
        if (isSwitching) return;

        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            fetchTransactions(filters, searchQuery);
        }, 500);
        return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
    }, [isMounted, searchQuery, filters, lastRefresh, activeFamily, isSwitching]);

    // Prepare sections for SectionList
    const sections = useMemo(() => {
        const groups: { [d: string]: { date: string; data: Transaction[]; total: { income: number; expense: number } } } = {};
        transactions.forEach(tx => {
            const d = tx.date.split('T')[0];
            if (!groups[d]) groups[d] = { date: d, data: [], total: { income: 0, expense: 0 } };
            groups[d].data.push(tx);
            if (tx.type === 'income') groups[d].total.income += Number(tx.amount);
            if (tx.type === 'expense') groups[d].total.expense += Math.abs(Number(tx.amount));
        });
        return Object.entries(groups)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([_, group]) => group);
    }, [transactions]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.type !== 'all') count++;
        if (filters.accountId) count++;
        if (filters.memberId) count++;
        if (filters.planId) count++;
        if (filters.dateRange.start || filters.dateRange.end) count++;
        return count;
    }, [filters]);

    const handleDeleteRequest = (tx: Transaction) => {
        const amount = Math.abs(Number(tx.amount) || 0);
        let impactMessage = tx.type === 'expense'
            ? `"${tx.account?.name || 'Account'}" balance will increase by ${formatCurrencyFull(amount)}`
            : tx.type === 'income'
                ? `"${tx.account?.name || 'Account'}" balance will decrease by ${formatCurrencyFull(amount)}`
                : tx.type === 'transfer'
                    ? `Balance of "${tx.account?.name}" will increase and "${tx.to_account?.name}" will decrease.`
                    : `Multiple accounts will be affected.`;
        setDeleteConfirm({ visible: true, transaction: tx, impactMessage });
    };

    const executeDelete = async () => {
        if (!deleteConfirm.transaction) return;
        setIsDeleting(true);
        try {
            const headers = await getAuthHeader();
            const res = await fetch(`${API_URL}/mobile/transactions/${deleteConfirm.transaction.id}`, { method: 'DELETE', headers });
            if (res.ok) {
                setTransactions(prev => prev.filter(t => t.id !== deleteConfirm.transaction!.id));
                // Note: Summary might be slightly off until refresh, but that's acceptable for now or we could adjust locally
                setDeleteConfirm({ visible: false, transaction: null, impactMessage: '' });
                fetchTransactions(filters, searchQuery); // Refresh to get correct summary
            }
        } catch (e) { console.error(e); } finally { setIsDeleting(false); }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    const onRefresh = useCallback(() => { setRefreshing(true); fetchTransactions(filters, searchQuery); }, [fetchTransactions, filters, searchQuery]);

    const renderSectionHeader = ({ section: { date, total } }: { section: { date: string; total: { income: number; expense: number } } }) => (
        <DateGroupHeader date={date} total={total} isDark={isDark} />
    );

    const renderItem = ({ item, index, section }: { item: Transaction; index: number; section: { data: Transaction[] } }) => (
        <View className="mx-6 overflow-hidden"
            style={{
                backgroundColor: isDark ? '#374151' : '#ffffff',
                shadowColor: isDark ? 'transparent' : '#e5e7eb',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                borderTopLeftRadius: index === 0 ? 24 : 0,
                borderTopRightRadius: index === 0 ? 24 : 0,
                borderBottomLeftRadius: index === section.data.length - 1 ? 24 : 0,
                borderBottomRightRadius: index === section.data.length - 1 ? 24 : 0,
                marginBottom: index === section.data.length - 1 ? 8 : 0
            }}>
            <TransactionItem
                transaction={item}
                isLast={index === section.data.length - 1}
                onDelete={handleDeleteRequest}
            />
        </View>
    );

    const ListHeader = () => (
        <View style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff' }} className="px-6 py-3">
            <View className="flex-row gap-3 mb-4">
                <View style={{ backgroundColor: isDark ? '#374151' : '#f9fafb', borderColor: isDark ? '#4b5563' : '#e5e7eb' }} className="flex-1 flex-row items-center rounded-2xl px-4 h-12 border">
                    <Search size={18} color="#94a3b8" />
                    <TextInput
                        className="flex-1 ml-3 text-[13px] font-semibold h-full"
                        style={{ color: isDark ? '#f9fafb' : '#111827' }}
                        placeholder="Search transactions..."
                        placeholderTextColor="#94a3b8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && <Pressable onPress={() => setSearchQuery("")}><X size={16} color="#94a3b8" /></Pressable>}
                </View>
                <Pressable
                    onPress={() => setFilterModalVisible(true)}
                    style={{ backgroundColor: activeFilterCount > 0 ? '#111827' : (isDark ? '#374151' : '#ffffff'), borderColor: activeFilterCount > 0 ? '#111827' : (isDark ? '#4b5563' : '#e5e7eb') }}
                    className={cn("w-12 h-12 rounded-2xl items-center justify-center border", activeFilterCount > 0 && "shadow-md")}
                >
                    {activeFilterCount > 0 && (
                        <View className="absolute -top-1 -right-1 bg-red-500 rounded-full h-4 w-4 items-center justify-center border border-white z-10">
                            <Text className="text-[9px] font-bold text-white">{activeFilterCount}</Text>
                        </View>
                    )}
                    <Filter size={18} color={activeFilterCount > 0 ? "#fff" : "#64748b"} />
                </Pressable>
            </View>

            <View className="flex-row items-center justify-between px-1 mb-1">
                <View style={{ backgroundColor: isDark ? '#374151' : '#f9fafb', borderColor: isDark ? '#4b5563' : '#f3f4f6' }} className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-full border">
                    <View className="h-1.5 w-1.5 bg-blue-500 rounded-full" />
                    <Text style={{ color: isDark ? '#9ca3af' : '#6b7280' }} className="text-[10px] font-bold uppercase tracking-wider">Swipe left to delete</Text>
                </View>
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-gray-900">
            {(!isMounted || isLoading) ? (
                <>
                    <View style={{ paddingTop: insets.top }} className="px-6 pb-4">
                        <View className="flex-row items-center justify-between mb-6">
                            <View className="flex-row items-center gap-3">
                                <View className="h-12 w-12 bg-gray-800 rounded-full" />
                                <View>
                                    <View className="h-3 w-20 bg-gray-800 rounded mb-2" />
                                    <View className="h-4 w-32 bg-gray-800 rounded" />
                                </View>
                            </View>
                        </View>
                    </View>
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#3b82f6" />
                        <Text className="text-gray-400 text-sm font-medium mt-4">Loading transactions...</Text>
                    </View>
                </>
            ) : (
                <>
                    <View style={{ paddingTop: insets.top }} className="px-6 pb-4">
                        <View className="flex-row items-center justify-between mb-5">
                            <Pressable onPress={() => setEditProfileModalVisible(true)} className="flex-row items-center gap-3 active:opacity-80">
                                <View className="h-12 w-12 bg-gray-700 rounded-full items-center justify-center overflow-hidden border-2 border-gray-600">
                                    {user?.picture ? <Image source={{ uri: user.picture }} style={{ width: '100%', height: '100%' }} /> : <Text className="font-bold text-white text-lg">{user?.name?.charAt(0) || "U"}</Text>}
                                </View>
                                <View>
                                    <Text className="text-gray-400 text-[10px] font-medium uppercase tracking-wider">{getGreeting()}</Text>
                                    <View className="flex-row items-center gap-1.5"><Text className="text-lg font-bold text-white">{user?.name?.split(' ')[0] || "User"}</Text><Edit2 size={11} color="#6b7280" /></View>
                                </View>
                            </Pressable>
                            <Pressable className="flex-row items-center bg-gray-800/80 border border-gray-700 rounded-full px-3 py-2 gap-2 active:bg-gray-700" onPress={() => setFamilyModalVisible(true)}>
                                <View className="h-5 w-5 rounded-full bg-blue-500/30 items-center justify-center"><Users size={10} color="#60a5fa" /></View>
                                <Text className="text-xs font-semibold text-gray-300">{activeFamily?.name || "My Family"}</Text>
                                <ChevronDown size={12} color="#6b7280" />
                            </Pressable>
                        </View>

                        <View className="bg-gray-800/60 rounded-2xl p-5 border border-gray-700/50 mb-2">
                            <View className="flex-row items-center gap-2 mb-1"><Receipt size={14} color="#60a5fa" /><Text className="text-gray-400 text-[10px] uppercase font-bold tracking-[2px]">Period Summary</Text></View>
                            <View className="flex-row items-end justify-between">
                                <View>
                                    <Text className="text-white text-3xl font-bold">Rp {formatCurrency(Math.abs(summary.balance))}</Text>
                                    <Text className={cn("text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full self-start", summary.balance >= 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>{summary.balance >= 0 ? 'SURPLUS' : 'DEFICIT'}</Text>
                                </View>
                                <View className="items-end">
                                    <View className="flex-row items-center gap-1.5 mb-1"><ArrowDownLeft size={10} color="#34d399" /><Text className="text-white text-xs font-bold">{formatCurrency(summary.income)}</Text></View>
                                    <View className="flex-row items-center gap-1.5"><ArrowUpRight size={10} color="#f87171" /><Text className="text-white text-xs font-bold">{formatCurrency(summary.expense)}</Text></View>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff' }} className="flex-1 rounded-t-[32px] overflow-hidden">
                        <View className="items-center pt-3 pb-1"><View style={{ backgroundColor: isDark ? '#4b5563' : '#e5e7eb' }} className="w-10 h-1 rounded-full" /></View>

                        <Animated.SectionList
                            sections={sections}
                            keyExtractor={(item) => item.id}
                            renderItem={renderItem}
                            renderSectionHeader={renderSectionHeader}
                            stickySectionHeadersEnabled={false}
                            contentContainerStyle={{ paddingBottom: 120 }}
                            showsVerticalScrollIndicator={false}
                            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                            ListHeaderComponent={<ListHeader />}
                            ListEmptyComponent={
                                !refreshing ? (
                                    <View className="items-center justify-center py-20 px-10">
                                        <View style={{ backgroundColor: isDark ? '#374151' : '#f9fafb' }} className="h-20 w-20 rounded-full items-center justify-center mb-4">
                                            <Search size={32} color={isDark ? '#6b7280' : '#cbd5e1'} />
                                        </View>
                                        <Text style={{ color: isDark ? '#9ca3af' : '#9ca3af' }} className="font-semibold text-center">No transactions found matching your filters.</Text>
                                    </View>
                                ) : null
                            }
                        />
                    </View>
                </>
            )}

            <Modal visible={deleteConfirm.visible} transparent animationType="fade">
                <View className="flex-1 bg-black/60 items-center justify-center p-6">
                    <View style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff' }} className="p-6 rounded-3xl w-full max-w-sm shadow-2xl">
                        <Text style={{ color: isDark ? '#f9fafb' : '#111827' }} className="text-xl font-bold mb-2">Delete Entry?</Text>
                        <Text style={{ color: isDark ? '#9ca3af' : '#6b7280' }} className="mb-6 leading-5">{deleteConfirm.impactMessage}</Text>
                        <View className="flex-row gap-3">
                            <Pressable onPress={() => setDeleteConfirm({ visible: false, transaction: null, impactMessage: '' })} style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6' }} className="flex-1 py-3.5 rounded-xl items-center active:opacity-80">
                                <Text style={{ color: isDark ? '#d1d5db' : '#374151' }} className="font-bold">Cancel</Text>
                            </Pressable>
                            <Pressable onPress={executeDelete} className="flex-1 bg-red-600 py-3.5 rounded-xl items-center active:bg-red-700 shadow-md shadow-red-200">
                                <Text className="font-bold text-white">Delete</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            <FilterModal
                visible={filterModalVisible}
                onClose={() => setFilterModalVisible(false)}
                currentFilters={filters}
                onApply={setFilters}
                accounts={accounts}
                plans={plans}
                members={activeFamily?.members || []}
                insets={insets}
            />

            {isMounted && familyModalVisible && <FamilyManagementModal visible={familyModalVisible} onClose={() => setFamilyModalVisible(false)} currentUserId={user?.id} onFamilyUpdated={() => fetchTransactions(filters, searchQuery)} />}
            {isMounted && editProfileModalVisible && <EditProfileModal visible={editProfileModalVisible} onClose={() => setEditProfileModalVisible(false)} onSuccess={(u) => { setUser(u); setEditProfileModalVisible(false); }} currentUser={user} />}
        </View>
    );
}

