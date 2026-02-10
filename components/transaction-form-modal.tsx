import { View, Text, Modal, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Switch, Pressable } from "react-native";
import { useState, useEffect, useMemo } from "react";
import { X, Calendar, Wallet, ChevronRight, CreditCard, ArrowRightLeft, Search, Check, ArrowDownLeft, ArrowUpRight, AlertCircle, Target } from "lucide-react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import { API_URL } from "../constants/config";
import { Image } from "expo-image";
import { cn } from "../lib/utils";
import { getAuthHeader } from "../lib/auth";
import { useTheme } from "../context/theme-context";
import { useLanguage } from "../context/language-context";

import { Button } from "./ui/button";
import { InlineLoader } from "./ui/loaders";

interface TransactionFormModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialType?: "income" | "expense" | "transfer";
}

const TRANSACTION_TYPES = [
    { key: 'expense', labelKey: 'transactionTypes.expense', icon: ArrowUpRight, color: '#ef4444' },
    { key: 'income', labelKey: 'transactionTypes.income', icon: ArrowDownLeft, color: '#22c55e' },
    { key: 'transfer', labelKey: 'transactionTypes.transfer', icon: ArrowRightLeft, color: '#3b82f6' },
] as const;

export function TransactionFormModal({ visible, onClose, onSuccess, initialType = 'expense' }: TransactionFormModalProps) {
    const { isDark } = useTheme();
    const { t } = useLanguage();
    const [type, setType] = useState<"income" | "expense" | "transfer">("expense");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [accounts, setAccounts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [budgets, setBudgets] = useState<any[]>([]);
    const [budgetItems, setBudgetItems] = useState<any[]>([]);

    const [selectedAccount, setSelectedAccount] = useState<any>(null);
    const [selectedTargetAccount, setSelectedTargetAccount] = useState<any>(null);
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [selectedBudget, setSelectedBudget] = useState<string>("unplanned");
    const [isUnplanned, setIsUnplanned] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (visible) {
            setType(initialType);
            fetchData();
        }
    }, [visible, initialType]);



    const fetchData = async () => {
        setIsLoading(true);
        try {
            const headers = await getAuthHeader();

            const [accRes, catRes, budRes] = await Promise.all([
                fetch(`${API_URL}/mobile/accounts`, { headers }),
                fetch(`${API_URL}/mobile/categories`, { headers }),
                fetch(`${API_URL}/mobile/budgets`, { headers })
            ]);

            if (accRes.ok && catRes.ok && budRes.ok) {
                const accData = await accRes.json();
                const catData = await catRes.json();
                const budData = await budRes.json();

                const accountsList = accData.accounts || accData || [];
                const budgetsList = Array.isArray(budData) ? budData : (budData.budgets || budData.plans || []);

                setAccounts(accountsList);
                setCategories(catData);
                setBudgets(budgetsList);

                if (accountsList.length > 0) setSelectedAccount(accountsList[0]);

                const defaultBudget = budgetsList.find((b: any) => b.is_default);
                if (defaultBudget) {
                    setSelectedBudget(defaultBudget.id);
                    setIsUnplanned(false);
                } else if (budgetsList.length > 0) {
                    setSelectedBudget(budgetsList[0].id);
                    setIsUnplanned(false);
                } else {
                    setIsUnplanned(true);
                }
            }
        } catch (error) {
            console.error("Failed to fetch form data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setSelectedCategory(null);
    }, [type]);

    useEffect(() => {
        const fetchAllocations = async () => {
            if (type === 'expense' && !isUnplanned && selectedBudget && selectedBudget !== 'unplanned') {
                try {
                    const headers = await getAuthHeader();
                    const res = await fetch(`${API_URL}/mobile/budget-allocations?budget_id=${selectedBudget}`, { headers });
                    if (res.ok) {
                        const items = await res.json();
                        setBudgetItems(items);
                    }
                } catch (e) {
                    console.error("Failed to fetch allocations", e);
                }
            } else {
                setBudgetItems([]);
            }
        }
        fetchAllocations();
    }, [selectedBudget, isUnplanned, type]);

    const displayedCategories = useMemo(() => {
        let baseCategories = categories.filter(c => {
            if (type === 'income') return c.type === 'income' || c.type === 'both';
            if (type === 'expense') return c.type === 'expense' || c.type === 'both';
            return true;
        });

        if (searchQuery) {
            baseCategories = baseCategories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        if (type === 'expense' && !isUnplanned && selectedBudget && budgetItems.length > 0) {
            let allocatedCats = budgetItems.map(item => {
                const percent = item.planned > 0 ? (item.spent / item.planned) * 100 : 0;
                const isFull = percent >= 100;
                return {
                    ...item,
                    percent,
                    isFull,
                    name: item.name || baseCategories.find(c => c.id === item.id)?.name || "Unknown",
                    icon: item.icon || baseCategories.find(c => c.id === item.id)?.icon
                };
            });

            if (searchQuery) {
                allocatedCats = allocatedCats.filter((c: any) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
            }

            return allocatedCats.sort((a: any, b: any) => {
                if (a.isFull === b.isFull) return 0;
                return a.isFull ? 1 : -1;
            });
        }

        return baseCategories.sort((a, b) => a.name.localeCompare(b.name));
    }, [categories, budgetItems, type, isUnplanned, selectedBudget, searchQuery]);

    const handleSubmit = async () => {
        if (!amount || !selectedAccount) {
            alert(t('transactionForm.enterAmountAndAccount'));
            return;
        }
        if (type === 'transfer' && !selectedTargetAccount) {
            alert(t('transactionForm.selectTargetAccount'));
            return;
        }

        setIsSubmitting(true);
        try {
            const headers = await getAuthHeader();
            const CleanAmount = Number(amount.replace(/\D/g, ''));

            const payload = {
                amount: CleanAmount,
                date: date.toISOString().split('T')[0],
                description,
                type,
                account_id: selectedAccount.id,
                target_account_id: type === 'transfer' ? selectedTargetAccount.id : null,
                category_id: type !== 'transfer' ? selectedCategory?.id : null,
                budget_id: (type === 'expense' && !isUnplanned && selectedBudget !== "unplanned") ? selectedBudget : null,
            };

            const res = await fetch(`${API_URL}/mobile/transactions`, {
                method: 'POST',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                onSuccess();
                onClose();
                setAmount("");
                setDescription("");
                setDate(new Date());
                setSelectedCategory(null);
            } else {
                const err = await res.json();
                alert("Failed to create transaction: " + JSON.stringify(err));
            }
        } catch (error) {
            console.error("Submit error:", error);
            alert(t('transactionForm.networkError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const BASE_URL = API_URL.replace('/api', '');
    const currentTypeConfig = TRANSACTION_TYPES.find(t => t.key === type)!;

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView
                behavior={'padding'}
                className="flex-1 justify-end bg-black/50"
            >
                <Pressable className="flex-1" onPress={onClose} />

                {/* Floating Card Modal */}
                <View style={{ backgroundColor: isDark ? '#1f2937' : '#f9fafb', maxHeight: '88%' }} className="mx-3 mb-4 rounded-[28px] overflow-hidden shadow-2xl">

                    {/* Header */}
                    <View style={{ backgroundColor: isDark ? '#374151' : '#ffffff', borderBottomColor: isDark ? '#4b5563' : '#f3f4f6' }} className="border-b px-5 pt-5 pb-4">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text style={{ color: isDark ? '#f9fafb' : '#111827' }} className="text-xl font-bold">{t('transactions.newTransaction')}</Text>
                            <Pressable
                                onPress={onClose}
                                style={{ backgroundColor: isDark ? '#4b5563' : '#f3f4f6' }}
                                className="p-2 rounded-full"
                            >
                                <X size={18} color={isDark ? '#d1d5db' : '#64748b'} />
                            </Pressable>
                        </View>

                        {/* Type Tabs */}
                        <View style={{ flexDirection: 'row', backgroundColor: isDark ? '#1f2937' : '#f3f4f6', padding: 4, borderRadius: 12 }}>
                            {TRANSACTION_TYPES.map((tt) => {
                                const isActive = type === tt.key;
                                const Icon = tt.icon;

                                return (
                                    <Pressable
                                        key={tt.key}
                                        onPress={() => setType(tt.key as any)}

                                        style={{
                                            flex: 1,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 6,
                                            paddingVertical: 10,
                                            borderRadius: 8,
                                            backgroundColor: isActive ? (isDark ? '#374151' : '#ffffff') : 'transparent',
                                            ...(isActive && {
                                                shadowColor: '#000',
                                                shadowOffset: { width: 0, height: 1 },
                                                shadowOpacity: 0.05,
                                                shadowRadius: 2,
                                                elevation: 1,
                                            })
                                        }}
                                    >
                                        <Icon size={16} color={isActive ? tt.color : "#94a3b8"} strokeWidth={2.5} />
                                        <Text style={{
                                            fontWeight: '600',
                                            fontSize: 12,
                                            color: isActive ? (isDark ? '#f9fafb' : '#111827') : '#9ca3af'
                                        }}>
                                            {t(tt.labelKey)}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>

                    {isLoading ? (
                        <View className="h-52 items-center justify-center">
                            <InlineLoader message={t('transactionForm.loadingDetails')} />
                        </View>
                    ) : (
                        <ScrollView
                            contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode="interactive"
                        >
                            {/* Amount Input - Beautiful Design */}
                            <View className="mb-5">
                                <Text style={{ color: isDark ? '#9ca3af' : '#6b7280' }} className="text-[10px] font-bold uppercase mb-2 ml-1">{t('transactionForm.amount')}</Text>
                                <View style={{ backgroundColor: isDark ? '#374151' : '#ffffff', borderColor: isDark ? '#4b5563' : '#e5e7eb' }} className="rounded-2xl border overflow-hidden">
                                    <View className="px-5 py-4 flex-row items-center">
                                        <Text style={{ color: isDark ? '#6b7280' : '#9ca3af' }} className="font-bold text-xl mr-2">Rp</Text>
                                        <TextInput
                                            className="flex-1 text-3xl font-bold"
                                            style={{ height: 48, paddingVertical: 0, color: isDark ? '#f9fafb' : '#111827' }}
                                            keyboardType="numeric"
                                            placeholder="0"
                                            placeholderTextColor={isDark ? '#6b7280' : '#d1d5db'}
                                            value={amount}
                                            onChangeText={(t) => {
                                                const clean = t.replace(/[^0-9]/g, '');
                                                setAmount(clean ? new Intl.NumberFormat('id-ID').format(parseInt(clean)) : '');
                                            }}
                                        />
                                    </View>
                                    {/* Type indicator bar */}
                                    <View className="h-1" style={{ backgroundColor: currentTypeConfig.color }} />
                                </View>
                            </View>

                            {/* Source Account */}
                            <View className="mb-4">
                                <Text style={{ color: isDark ? '#9ca3af' : '#6b7280' }} className="text-[10px] font-bold uppercase mb-2 ml-1">
                                    {type === 'transfer' ? t('transactionForm.fromAccount') : t('transactionForm.account')}
                                </Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                    {accounts.map(acc => {
                                        const isSelected = selectedAccount?.id === acc.id;
                                        return (
                                            <Pressable key={acc.id} onPress={() => setSelectedAccount(acc)} >
                                                <View style={{
                                                    backgroundColor: isSelected ? (isDark ? '#1e3a5f' : '#eff6ff') : (isDark ? '#374151' : '#ffffff'),
                                                    borderColor: isSelected ? '#60a5fa' : (isDark ? '#4b5563' : '#e5e7eb')
                                                }} className={cn(
                                                    "w-36 p-3 rounded-xl border flex-row items-center gap-2"
                                                )}>
                                                    <View style={{ backgroundColor: isSelected ? (isDark ? '#1e40af' : '#dbeafe') : (isDark ? '#4b5563' : '#f3f4f6') }} className="h-8 w-8 rounded-lg items-center justify-center overflow-hidden">
                                                        {acc.logo ? (
                                                            <Image source={{ uri: `${BASE_URL}/bank-logo/${acc.logo}` }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
                                                        ) : (
                                                            <Wallet size={14} color={isSelected ? "#3b82f6" : "#64748b"} />
                                                        )}
                                                    </View>
                                                    <View className="flex-1">
                                                        <Text style={{ color: isSelected ? '#3b82f6' : (isDark ? '#d1d5db' : '#374151') }} className="text-[11px] font-semibold" numberOfLines={1}>{acc.name}</Text>
                                                        <Text style={{ color: isDark ? '#6b7280' : '#9ca3af' }} className="text-[9px]">{new Intl.NumberFormat('id-ID', { notation: "compact" }).format(acc.current_balance || 0)}</Text>
                                                    </View>
                                                    {isSelected && <Check size={14} color="#3b82f6" strokeWidth={3} />}
                                                </View>
                                            </Pressable>
                                        );
                                    })}
                                </ScrollView>
                            </View>

                            {/* Target Account (Transfer) */}
                            {type === 'transfer' && (
                                <View className="mb-4">
                                    <Text style={{ color: isDark ? '#9ca3af' : '#6b7280' }} className="text-[10px] font-bold uppercase mb-2 ml-1">{t('transactionForm.toAccount')}</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                        {accounts.filter(a => a.id !== selectedAccount?.id).map(acc => {
                                            const isSelected = selectedTargetAccount?.id === acc.id;
                                            return (
                                                <Pressable key={acc.id} onPress={() => setSelectedTargetAccount(acc)} >
                                                    <View style={{
                                                        backgroundColor: isSelected ? (isDark ? '#14532d' : '#f0fdf4') : (isDark ? '#374151' : '#ffffff'),
                                                        borderColor: isSelected ? '#4ade80' : (isDark ? '#4b5563' : '#e5e7eb')
                                                    }} className="w-36 p-3 rounded-xl border flex-row items-center gap-2">
                                                        <View style={{ backgroundColor: isSelected ? (isDark ? '#166534' : '#dcfce7') : (isDark ? '#4b5563' : '#f3f4f6') }} className="h-8 w-8 rounded-lg items-center justify-center">
                                                            {acc.logo ? <Image source={{ uri: `${BASE_URL}/bank-logo/${acc.logo}` }} style={{ width: '100%', height: '100%' }} contentFit="contain" /> : <Wallet size={14} color={isSelected ? "#22c55e" : "#64748b"} />}
                                                        </View>
                                                        <Text style={{ color: isSelected ? '#22c55e' : (isDark ? '#d1d5db' : '#374151') }} className="text-[11px] font-semibold flex-1" numberOfLines={1}>{acc.name}</Text>
                                                        {isSelected && <Check size={14} color="#22c55e" strokeWidth={3} />}
                                                    </View>
                                                </Pressable>
                                            );
                                        })}
                                    </ScrollView>
                                </View>
                            )}

                            {/* Date Picker */}
                            <Pressable onPress={() => setShowDatePicker(true)} className="mb-4">
                                <View style={{ backgroundColor: isDark ? '#374151' : '#ffffff', borderColor: isDark ? '#4b5563' : '#e5e7eb' }} className="flex-row items-center p-3 rounded-xl border">
                                    <View style={{ backgroundColor: isDark ? '#312e81' : '#eef2ff' }} className="h-9 w-9 rounded-lg items-center justify-center mr-3">
                                        <Calendar size={16} color="#6366f1" />
                                    </View>
                                    <View className="flex-1">
                                        <Text style={{ color: isDark ? '#6b7280' : '#9ca3af' }} className="text-[9px] font-bold uppercase">{t('transactionForm.date')}</Text>
                                        <Text style={{ color: isDark ? '#f9fafb' : '#111827' }} className="font-semibold text-[13px]">
                                            {date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                                        </Text>
                                    </View>
                                    <ChevronRight size={16} color={isDark ? '#6b7280' : '#cbd5e1'} />
                                </View>
                            </Pressable>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={date}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(event, selectedDate) => {
                                        setShowDatePicker(Platform.OS === 'ios');
                                        if (selectedDate) setDate(selectedDate);
                                    }}
                                />
                            )}

                            {/* Budget Planning (Expense Only) */}
                            {type === 'expense' && (
                                <View className="mb-4">
                                    <Text style={{ color: isDark ? '#9ca3af' : '#6b7280' }} className="text-[10px] font-bold uppercase mb-2 ml-1">{t('transactionForm.planning')}</Text>

                                    {budgets.length > 0 ? (
                                        <View style={{ backgroundColor: isDark ? '#374151' : '#ffffff', borderColor: isDark ? '#4b5563' : '#e5e7eb' }} className="rounded-xl border p-3">
                                            <View className="flex-row items-center justify-between mb-3">
                                                <View className="flex-row items-center gap-2">
                                                    <View style={{ backgroundColor: isDark ? '#451a03' : '#fef3c7' }} className="h-8 w-8 rounded-lg items-center justify-center">
                                                        <Target size={14} color="#d97706" />
                                                    </View>
                                                    <Text style={{ color: isDark ? '#f9fafb' : '#1f2937' }} className="font-semibold text-[13px]">{t('transactionForm.budgetPlan')}</Text>
                                                </View>
                                                <View className="flex-row items-center gap-2">
                                                    <Text style={{ color: isDark ? '#9ca3af' : '#6b7280' }} className="text-[10px]">{t('transactionForm.unplanned')}</Text>
                                                    <Switch
                                                        value={isUnplanned}
                                                        onValueChange={setIsUnplanned}
                                                        trackColor={{ false: "#e2e8f0", true: "#fbbf24" }}
                                                        thumbColor={"#ffffff"}
                                                        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                                                    />
                                                </View>
                                            </View>

                                            {!isUnplanned && (
                                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                                                    {budgets.map(b => (
                                                        <Pressable key={b.id} onPress={() => setSelectedBudget(b.id)} >
                                                            <View style={{
                                                                backgroundColor: selectedBudget === b.id ? (isDark ? '#451a03' : '#fef3c7') : (isDark ? '#4b5563' : '#f9fafb'),
                                                                borderColor: selectedBudget === b.id ? '#fbbf24' : (isDark ? '#6b7280' : '#e5e7eb')
                                                            }} className={cn(
                                                                "px-3 py-2 rounded-lg border flex-row items-center gap-1.5"
                                                            )}>
                                                                {selectedBudget === b.id && <Check size={12} color="#d97706" strokeWidth={3} />}
                                                                <Text style={{ color: selectedBudget === b.id ? '#d97706' : (isDark ? '#d1d5db' : '#4b5563') }} className="text-[11px] font-semibold">{b.name}</Text>
                                                            </View>
                                                        </Pressable>
                                                    ))}
                                                </ScrollView>
                                            )}
                                        </View>
                                    ) : (
                                        <View style={{ backgroundColor: isDark ? '#451a03' : '#fffbeb', borderColor: isDark ? '#78350f' : '#fde68a' }} className="rounded-xl border p-4">
                                            <View className="flex-row items-start gap-3">
                                                <View style={{ backgroundColor: isDark ? '#78350f' : '#fef3c7' }} className="h-8 w-8 rounded-lg items-center justify-center mt-0.5">
                                                    <AlertCircle size={16} color="#d97706" />
                                                </View>
                                                <View className="flex-1">
                                                    <Text style={{ color: isDark ? '#fbbf24' : '#92400e' }} className="font-semibold text-sm mb-1">{t('transactionForm.noBudgetPlan')}</Text>
                                                    <Text style={{ color: isDark ? '#d97706' : '#b45309' }} className="text-xs leading-relaxed">
                                                        {t('transactionForm.noBudgetPlanDesc')}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* Category Selection */}
                            {type !== 'transfer' && (
                                <View className="mb-4">
                                    <Text style={{ color: isDark ? '#9ca3af' : '#6b7280' }} className="text-[10px] font-bold uppercase mb-2 ml-1">{t('transactionForm.category')}</Text>

                                    <View style={{ backgroundColor: isDark ? '#374151' : '#ffffff', borderColor: isDark ? '#4b5563' : '#e5e7eb' }} className="mb-2 flex-row items-center rounded-lg px-3 py-2 border">
                                        <Search size={14} color="#9ca3af" />
                                        <TextInput
                                            className="flex-1 ml-2 text-[13px]"
                                            style={{ color: isDark ? '#f9fafb' : '#111827' }}
                                            placeholder={t('transactionForm.searchCategories')}
                                            placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                            value={searchQuery}
                                            onChangeText={setSearchQuery}
                                        />
                                    </View>

                                    <View className="flex-row flex-wrap gap-2">
                                        {displayedCategories.slice(0, 12).map(cat => {
                                            const isSelected = selectedCategory?.id === cat.id;
                                            const hasAllocation = cat.percent !== undefined;
                                            const isFull = cat.percent >= 100;

                                            return (
                                                <Pressable
                                                    key={`cat-${cat.id}`}
                                                    onPress={() => setSelectedCategory(cat)}
                                                    style={{ width: '31%' }}

                                                >
                                                    <View style={{
                                                        backgroundColor: isSelected ? '#111827' : (isDark ? '#374151' : '#ffffff'),
                                                        borderColor: isSelected ? '#111827' : (isDark ? '#4b5563' : '#e5e7eb'),
                                                        opacity: (isFull && !isSelected) ? 0.5 : 1
                                                    }} className="p-2.5 rounded-xl border items-center">
                                                        <View style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : (isDark ? '#4b5563' : '#f3f4f6') }} className="w-8 h-8 items-center justify-center rounded-lg mb-1">
                                                            {cat.icon ? <Text className="text-base">{cat.icon}</Text> : <CreditCard size={14} color={isSelected ? "#fff" : "#64748b"} />}
                                                        </View>
                                                        <Text style={{ color: isSelected ? '#ffffff' : (isDark ? '#d1d5db' : '#374151') }} className="text-[10px] font-semibold text-center" numberOfLines={1}>{cat.name}</Text>
                                                        {hasAllocation && (
                                                            <View style={{ backgroundColor: isDark ? '#4b5563' : '#e5e7eb' }} className="w-full h-1 rounded-full mt-1.5 overflow-hidden">
                                                                <View style={{ width: `${Math.min(cat.percent, 100)}%` }} className={cn("h-full", isFull ? "bg-red-400" : "bg-blue-400")} />
                                                            </View>
                                                        )}
                                                    </View>
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}

                            {/* Note */}
                            <View className="mb-4">
                                <Text style={{ color: isDark ? '#9ca3af' : '#6b7280' }} className="text-[10px] font-bold uppercase mb-2 ml-1">{t('transactionForm.note')}</Text>
                                <TextInput
                                    className="p-3 rounded-xl border text-[13px]"
                                    style={{ backgroundColor: isDark ? '#374151' : '#ffffff', borderColor: isDark ? '#4b5563' : '#e5e7eb', color: isDark ? '#f9fafb' : '#111827', minHeight: 60 }}
                                    placeholder={t('transactionForm.notePlaceholder')}
                                    placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                    multiline
                                    numberOfLines={2}
                                    value={description}
                                    onChangeText={setDescription}
                                    textAlignVertical="top"
                                />
                            </View>

                            {/* Save Button */}
                            <Button
                                label={t('transactionForm.saveTransaction')}
                                onPress={handleSubmit}
                                isLoading={isSubmitting}
                                className={cn("rounded-xl", isSubmitting ? (isDark ? "bg-gray-600" : "bg-gray-300") : (isDark ? "bg-blue-600" : "bg-gray-900"))}
                            />
                        </ScrollView>
                    )}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
