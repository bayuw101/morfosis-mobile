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
import { ScreenLoader } from "../../components/ui/loaders";
import { StatusBar } from "expo-status-bar";

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

const DateGroupHeader = ({ date, total, isDark, t }: { date: string; total: { income: number; expense: number }; isDark: boolean; t: (key: string) => string }) => {
    const dateObj = new Date(date);
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);
    let displayDate = dateObj.toDateString() === today.toDateString() ? t('transactions.today') : dateObj.toDateString() === yesterday.toDateString() ? t('transactions.yesterday') : dateObj.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    return (
        <View style={{ backgroundColor: isDark ? '#1f2937' : '#f8fafc' }} className="px-5 py-2.5 flex-row items-center justify-between">
            <Text style={{ color: isDark ? '#6b7280' : '#94a3b8' }} className="text-[10px] font-bold uppercase tracking-widest">{displayDate}</Text>
            <View className="flex-row items-center gap-2.5">
                {total.income > 0 && <View className="flex-row items-center gap-1"><TrendingUp size={10} color="#22c55e" /><Text className="text-[10px] font-bold text-green-500">+{formatCurrency(total.income)}</Text></View>}
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

    // --- Theme-aware colors (matching dashboard) ---
    const headerBg = isDark ? '#111827' : '#1e40af';
    const headerCardBg = isDark ? 'rgba(31,41,55,0.8)' : 'rgba(255,255,255,0.15)';
    const headerCardBorder = isDark ? 'rgba(55,65,81,0.6)' : 'rgba(255,255,255,0.2)';
    const headerSubText = isDark ? '#9ca3af' : 'rgba(255,255,255,0.7)';
    const familyPillBg = isDark ? 'rgba(31,41,55,0.8)' : 'rgba(255,255,255,0.2)';
    const familyPillBorder = isDark ? '#374151' : 'rgba(255,255,255,0.3)';
    const familyPillText = isDark ? '#d1d5db' : 'rgba(255,255,255,0.9)';

    const contentBg = isDark ? '#1f2937' : '#f8fafc';
    const cardBg = isDark ? '#374151' : '#ffffff';
    const cardBorder = isDark ? '#4b5563' : '#e2e8f0';
    const textPrimary = isDark ? '#f9fafb' : '#0f172a';
    const textSecondary = isDark ? '#9ca3af' : '#64748b';
    const textMuted = isDark ? '#6b7280' : '#94a3b8';

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
            const txQuery = `${query}&include_summary=false`;
            const txRes = await fetch(`${API_URL}/mobile/transactions?${txQuery}`, { headers });

            if (txRes.ok) {
                const responseData = await txRes.json();
                if (Array.isArray(responseData.data)) {
                    setTransactions(responseData.data);

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
                setDeleteConfirm({ visible: false, transaction: null, impactMessage: '' });
                fetchTransactions(filters, searchQuery);
            }
        } catch (e) { console.error(e); } finally { setIsDeleting(false); }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('greetings.morning');
        if (hour < 17) return t('greetings.afternoon');
        return t('greetings.evening');
    };

    const onRefresh = useCallback(() => { setRefreshing(true); fetchTransactions(filters, searchQuery); }, [fetchTransactions, filters, searchQuery]);

    const renderSectionHeader = ({ section: { date, total } }: { section: { date: string; total: { income: number; expense: number } } }) => (
        <DateGroupHeader date={date} total={total} isDark={isDark} t={t} />
    );

    const renderItem = ({ item, index, section }: { item: Transaction; index: number; section: { data: Transaction[] } }) => (
        <View className="mx-6 overflow-hidden"
            style={{
                backgroundColor: cardBg,
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
                isDark={isDark}
            />
        </View>
    );

    const ListHeader = () => (
        <View style={{ backgroundColor: contentBg }} className="px-6 py-3">
            <View className="flex-row gap-3 mb-4">
                <View style={{ backgroundColor: isDark ? '#374151' : '#ffffff', borderColor: cardBorder }} className="flex-1 flex-row items-center rounded-2xl px-4 h-12 border">
                    <Search size={18} color={textMuted} />
                    <TextInput
                        className="flex-1 ml-3 text-[13px] font-semibold h-full"
                        style={{ color: textPrimary }}
                        placeholder={t('transactions.searchPlaceholder')}
                        placeholderTextColor={textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && <Pressable onPress={() => setSearchQuery("")}><X size={16} color={textMuted} /></Pressable>}
                </View>
                <Pressable
                    onPress={() => setFilterModalVisible(true)}
                    style={{
                        backgroundColor: activeFilterCount > 0 ? '#2563eb' : cardBg,
                        borderColor: activeFilterCount > 0 ? '#2563eb' : cardBorder,
                    }}
                    className={cn("w-12 h-12 rounded-2xl items-center justify-center border", activeFilterCount > 0 && "shadow-md")}
                >
                    {activeFilterCount > 0 && (
                        <View style={{ borderColor: isDark ? '#1f2937' : '#ffffff' }} className="absolute -top-1 -right-1 bg-red-500 rounded-full h-4 w-4 items-center justify-center border z-10">
                            <Text className="text-[9px] font-bold text-white">{activeFilterCount}</Text>
                        </View>
                    )}
                    <Filter size={18} color={activeFilterCount > 0 ? "#fff" : textSecondary} />
                </Pressable>
            </View>

            <View className="flex-row items-center justify-between px-1 mb-1">
                <View style={{ backgroundColor: isDark ? '#374151' : '#f1f5f9', borderColor: isDark ? '#4b5563' : '#e2e8f0' }} className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-full border">
                    <View className="h-1.5 w-1.5 bg-blue-500 rounded-full" />
                    <Text style={{ color: textSecondary }} className="text-[10px] font-bold uppercase tracking-wider">{t('transactions.swipeToDelete')}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: headerBg }}>
            <StatusBar style="light" />
            {(!isMounted || isLoading) ? (
                <ScreenLoader message={t('common.loading')} />
            ) : (
                <>
                    <View style={{ paddingTop: insets.top }} className="px-6 pb-4">
                        <View className="flex-row items-center justify-between mb-5">
                            <Pressable onPress={() => setEditProfileModalVisible(true)} className="flex-row items-center gap-3 active:opacity-80">
                                <View style={{ borderColor: isDark ? '#4b5563' : 'rgba(255,255,255,0.4)' }} className="h-12 w-12 bg-white/20 rounded-full items-center justify-center overflow-hidden border-2">
                                    {user?.picture ? <Image source={{ uri: user.picture }} style={{ width: '100%', height: '100%' }} /> : <Text className="font-bold text-white text-lg">{user?.name?.charAt(0) || "U"}</Text>}
                                </View>
                                <View>
                                    <Text style={{ color: headerSubText }} className="text-[10px] font-medium uppercase tracking-wider">{getGreeting()}</Text>
                                    <View className="flex-row items-center gap-1.5"><Text className="text-lg font-bold text-white">{user?.name?.split(' ')[0] || "User"}</Text><Edit2 size={11} color={headerSubText} /></View>
                                </View>
                            </Pressable>
                            <Pressable
                                style={{ backgroundColor: familyPillBg, borderColor: familyPillBorder }}
                                className="flex-row items-center border rounded-full px-3 py-2 gap-2 active:opacity-80"
                                onPress={() => setFamilyModalVisible(true)}
                            >
                                <View className="h-5 w-5 rounded-full bg-blue-400/30 items-center justify-center"><Users size={10} color="#93c5fd" /></View>
                                <Text style={{ color: familyPillText }} className="text-xs font-semibold">{activeFamily?.name || "My Family"}</Text>
                                <ChevronDown size={12} color={familyPillText} />
                            </Pressable>
                        </View>


                        <View style={{ backgroundColor: headerCardBg, borderColor: headerCardBorder }} className="rounded-2xl mb-4 p-4 border">
                            <View className="flex-row items-center gap-2 mb-1"><Receipt size={14} color="#93c5fd" /><Text style={{ color: headerSubText }} className="text-[10px] uppercase font-bold tracking-[2px]">{t('transactions.periodSummary')}</Text></View>
                            <View className="flex-row items-end justify-between">
                                <View>
                                    <Text className="text-white text-3xl font-bold">Rp {formatCurrency(Math.abs(summary.balance))}</Text>
                                    <Text className={cn("text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full self-start", summary.balance >= 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>{summary.balance >= 0 ? t('transactions.surplus') : t('transactions.deficit')}</Text>
                                </View>
                                <View className="items-end">
                                    <View className="flex-row items-center gap-1.5 mb-1"><ArrowDownLeft size={10} color="#6ee7b7" /><Text className="text-white text-xs font-bold">{formatCurrency(summary.income)}</Text></View>
                                    <View className="flex-row items-center gap-1.5"><ArrowUpRight size={10} color="#fca5a5" /><Text className="text-white text-xs font-bold">{formatCurrency(summary.expense)}</Text></View>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={{ backgroundColor: contentBg, marginTop: -14 }} className="flex-1 rounded-t-[32px] overflow-hidden">
                        <View className="items-center pt-3 pb-1"><View style={{ backgroundColor: isDark ? '#4b5563' : '#cbd5e1' }} className="w-10 h-1 rounded-full" /></View>

                        <Animated.SectionList
                            sections={sections}
                            keyExtractor={(item) => item.id}
                            renderItem={renderItem}
                            renderSectionHeader={renderSectionHeader}
                            stickySectionHeadersEnabled={false}
                            contentContainerStyle={{ paddingBottom: 120 }}
                            showsVerticalScrollIndicator={false}
                            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
                            ListHeaderComponent={<ListHeader />}
                            ListEmptyComponent={
                                !refreshing ? (
                                    <View className="items-center justify-center py-20 px-10">
                                        <View style={{ backgroundColor: isDark ? '#374151' : '#f1f5f9' }} className="h-20 w-20 rounded-full items-center justify-center mb-4">
                                            <Search size={32} color={textMuted} />
                                        </View>
                                        <Text style={{ color: textSecondary }} className="font-semibold text-center">{t('transactions.noResults')}</Text>
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
                        <Text style={{ color: textPrimary }} className="text-xl font-bold mb-2">{t('transactions.deleteTitle')}</Text>
                        <Text style={{ color: textSecondary }} className="mb-6 leading-5">{deleteConfirm.impactMessage}</Text>
                        <View className="flex-row gap-3">
                            <Pressable onPress={() => setDeleteConfirm({ visible: false, transaction: null, impactMessage: '' })} style={{ backgroundColor: isDark ? '#374151' : '#f1f5f9' }} className="flex-1 py-3.5 rounded-xl items-center active:opacity-80">
                                <Text style={{ color: isDark ? '#d1d5db' : '#374151' }} className="font-bold">{t('common.cancel')}</Text>
                            </Pressable>
                            <Pressable onPress={executeDelete} className="flex-1 bg-red-600 py-3.5 rounded-xl items-center active:bg-red-700 shadow-md">
                                <Text className="font-bold text-white">{t('common.delete')}</Text>
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
                isDark={isDark}
            />

            {isMounted && familyModalVisible && <FamilyManagementModal visible={familyModalVisible} onClose={() => setFamilyModalVisible(false)} currentUserId={user?.id} onFamilyUpdated={() => fetchTransactions(filters, searchQuery)} />}
            {isMounted && editProfileModalVisible && <EditProfileModal visible={editProfileModalVisible} onClose={() => setEditProfileModalVisible(false)} onSuccess={(u) => { setUser(u); setEditProfileModalVisible(false); }} currentUser={user} />}
        </View>
    );
}
