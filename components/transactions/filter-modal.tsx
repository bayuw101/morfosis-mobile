
import React, { useState, useEffect } from "react";
import { View, Text, Modal, Pressable, ScrollView, Switch } from "react-native";
import { X, Calendar, User, CreditCard, Layers, Check } from "lucide-react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import { cn } from "../../lib/utils";
import { Image } from "expo-image";

export interface FilterState {
    type: 'all' | 'income' | 'expense' | 'transfer';
    accountId: string | null;
    memberId: string | null;
    planId: string | null;
    dateRange: {
        start: Date | null;
        end: Date | null;
    };
}

interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
    currentFilters: FilterState;
    onApply: (filters: FilterState) => void;
    accounts: any[];
    members: any[];
    plans: any[];
    insets: { top: number; bottom: number };
    isDark?: boolean;
}

export function FilterModal({ visible, onClose, currentFilters, onApply, accounts, members, plans, insets, isDark = false }: FilterModalProps) {
    const [filters, setFilters] = useState<FilterState>(currentFilters);
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    useEffect(() => {
        if (visible) {
            setFilters(currentFilters);
        }
    }, [visible, currentFilters]);

    const handleApply = () => {
        onApply(filters);
        onClose();
    };

    const handleReset = () => {
        setFilters({
            type: 'all',
            accountId: null,
            memberId: null,
            planId: null,
            dateRange: { start: null, end: null }
        });
    };

    const formatDate = (date: Date | null) => {
        if (!date) return "Select Date";
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    // Theme colors
    const sheetBg = isDark ? '#1f2937' : '#ffffff';
    const headerBorder = isDark ? '#374151' : '#f1f5f9';
    const textPrimary = isDark ? '#f9fafb' : '#0f172a';
    const textSecondary = isDark ? '#9ca3af' : '#64748b';
    const textMuted = isDark ? '#6b7280' : '#94a3b8';
    const chipBg = isDark ? '#374151' : '#ffffff';
    const chipBorder = isDark ? '#4b5563' : '#e2e8f0';
    const chipActiveBg = isDark ? '#2563eb' : '#0f172a';
    const chipActiveBorder = isDark ? '#2563eb' : '#0f172a';
    const closeBtnBg = isDark ? '#374151' : '#f1f5f9';
    const inputBg = isDark ? '#374151' : '#ffffff';
    const inputBorder = isDark ? '#4b5563' : '#e2e8f0';
    const memberBg = isDark ? '#374151' : '#f8fafc';
    const memberBorder = isDark ? '#4b5563' : '#e2e8f0';
    const footerBg = isDark ? '#1f2937' : '#ffffff';
    const resetBtnBg = isDark ? '#374151' : '#f1f5f9';

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View className="flex-1 bg-black/50 justify-end">
                <Pressable className="flex-1" onPress={onClose} />
                <View
                    style={{ paddingBottom: insets.bottom + 20, maxHeight: '90%', backgroundColor: sheetBg }}
                    className="rounded-t-[32px] overflow-hidden"
                >
                    <View style={{ borderBottomColor: headerBorder }} className="px-6 py-4 border-b flex-row items-center justify-between">
                        <Text style={{ color: textPrimary }} className="text-lg font-bold">Filter Transactions</Text>
                        <Pressable onPress={onClose} style={{ backgroundColor: closeBtnBg }} className="p-2 rounded-full">
                            <X size={20} color={textSecondary} />
                        </Pressable>
                    </View>

                    <ScrollView className="px-6" contentContainerStyle={{ paddingVertical: 20 }}>
                        {/* Transaction Type */}
                        <View className="mb-6">
                            <Text style={{ color: textMuted }} className="text-xs font-bold uppercase tracking-wider mb-3">Type</Text>
                            <View className="flex-row gap-2">
                                {['all', 'income', 'expense', 'transfer'].map((t) => (
                                    <Pressable
                                        key={t}
                                        onPress={() => setFilters({ ...filters, type: t as any })}
                                        style={{
                                            backgroundColor: filters.type === t ? chipActiveBg : chipBg,
                                            borderColor: filters.type === t ? chipActiveBorder : chipBorder,
                                        }}
                                        className="flex-1 py-2.5 rounded-xl items-center border"
                                    >
                                        <Text style={{ color: filters.type === t ? '#ffffff' : textSecondary }} className="text-xs font-bold capitalize">
                                            {t}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        {/* Date Range */}
                        <View className="mb-6">
                            <Text style={{ color: textMuted }} className="text-xs font-bold uppercase tracking-wider mb-3">Date Range</Text>
                            <View className="flex-row gap-3">
                                <Pressable
                                    onPress={() => setShowStartDatePicker(true)}
                                    style={{ borderColor: inputBorder, backgroundColor: inputBg }}
                                    className="flex-1 border rounded-xl p-3 flex-row items-center justify-between"
                                >
                                    <View>
                                        <Text style={{ color: textMuted }} className="text-[10px] font-medium mb-0.5">Start Date</Text>
                                        <Text style={{ color: textPrimary }} className="font-semibold">{formatDate(filters.dateRange.start)}</Text>
                                    </View>
                                    <Calendar size={18} color={textMuted} />
                                </Pressable>
                                <Pressable
                                    onPress={() => setShowEndDatePicker(true)}
                                    style={{ borderColor: inputBorder, backgroundColor: inputBg }}
                                    className="flex-1 border rounded-xl p-3 flex-row items-center justify-between"
                                >
                                    <View>
                                        <Text style={{ color: textMuted }} className="text-[10px] font-medium mb-0.5">End Date</Text>
                                        <Text style={{ color: textPrimary }} className="font-semibold">{formatDate(filters.dateRange.end)}</Text>
                                    </View>
                                    <Calendar size={18} color={textMuted} />
                                </Pressable>
                            </View>
                            {(filters.dateRange.start || filters.dateRange.end) && (
                                <Pressable onPress={() => setFilters({ ...filters, dateRange: { start: null, end: null } })} className="mt-2 self-start">
                                    <Text className="text-xs font-bold text-red-500">Clear Dates</Text>
                                </Pressable>
                            )}
                        </View>

                        {/* Accounts */}
                        <View className="mb-6">
                            <Text style={{ color: textMuted }} className="text-xs font-bold uppercase tracking-wider mb-3">Accounts</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                <Pressable
                                    onPress={() => setFilters({ ...filters, accountId: null })}
                                    style={{
                                        backgroundColor: !filters.accountId ? '#2563eb' : chipBg,
                                        borderColor: !filters.accountId ? '#2563eb' : chipBorder,
                                    }}
                                    className="px-4 py-2.5 rounded-xl border flex-row items-center gap-2"
                                >
                                    <Layers size={14} color={!filters.accountId ? "white" : textSecondary} />
                                    <Text style={{ color: !filters.accountId ? '#ffffff' : textSecondary }} className="font-bold text-xs">All Accounts</Text>
                                </Pressable>
                                {accounts.map(acc => (
                                    <Pressable
                                        key={acc.id}
                                        onPress={() => setFilters({ ...filters, accountId: filters.accountId === acc.id ? null : acc.id })}
                                        style={{
                                            backgroundColor: filters.accountId === acc.id ? '#2563eb' : chipBg,
                                            borderColor: filters.accountId === acc.id ? '#2563eb' : chipBorder,
                                        }}
                                        className="pl-2 pr-4 py-2 rounded-xl border flex-row items-center gap-2"
                                    >
                                        <View style={{ backgroundColor: isDark ? '#1f2937' : '#f8fafc', borderColor: isDark ? '#4b5563' : '#e2e8f0' }} className="h-6 w-6 rounded-full items-center justify-center overflow-hidden border">
                                            {acc.logo ? (
                                                <Image source={{ uri: acc.logo }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
                                            ) : (
                                                <CreditCard size={12} color={textSecondary} />
                                            )}
                                        </View>
                                        <Text style={{ color: filters.accountId === acc.id ? '#ffffff' : textSecondary }} className="font-bold text-xs">{acc.name}</Text>
                                    </Pressable>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Family Members */}
                        <View className="mb-6">
                            <Text style={{ color: textMuted }} className="text-xs font-bold uppercase tracking-wider mb-3">Family Member</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                                <Pressable
                                    onPress={() => setFilters({ ...filters, memberId: null })}
                                    className="items-center gap-2"
                                >
                                    <View style={{
                                        backgroundColor: !filters.memberId ? chipActiveBg : memberBg,
                                        borderColor: !filters.memberId ? chipActiveBorder : memberBorder,
                                    }} className="h-14 w-14 rounded-full items-center justify-center border-2">
                                        <User size={24} color={!filters.memberId ? "white" : textMuted} />
                                    </View>
                                    <Text style={{ color: !filters.memberId ? textPrimary : textMuted }} className="text-[10px] font-bold">Everyone</Text>
                                </Pressable>
                                {members.map(member => (
                                    <Pressable
                                        key={member.id}
                                        onPress={() => setFilters({ ...filters, memberId: filters.memberId === member.id ? null : member.id })}
                                        className="items-center gap-2"
                                    >
                                        <View style={{
                                            backgroundColor: memberBg,
                                            borderColor: filters.memberId === member.id ? '#2563eb' : memberBorder,
                                        }} className="h-14 w-14 rounded-full items-center justify-center border-2 overflow-hidden">
                                            <Text style={{ color: textMuted }} className="font-bold text-lg">{(member.name || "?").charAt(0)}</Text>
                                            {filters.memberId === member.id && (
                                                <View className="absolute inset-0 bg-blue-600/20 items-center justify-center">
                                                    <Check size={20} color="#2563eb" strokeWidth={3} />
                                                </View>
                                            )}
                                        </View>
                                        <Text style={{ color: filters.memberId === member.id ? '#2563eb' : textMuted }} className="text-[10px] font-bold">
                                            {(member.name || "Unknown").split(' ')[0]}
                                        </Text>
                                    </Pressable>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Plans */}
                        {plans.length > 0 && (
                            <View className="mb-6">
                                <Text style={{ color: textMuted }} className="text-xs font-bold uppercase tracking-wider mb-3">Planning</Text>
                                <View className="flex-row flex-wrap gap-2">
                                    <Pressable
                                        onPress={() => setFilters({ ...filters, planId: null })}
                                        style={{
                                            backgroundColor: !filters.planId ? (isDark ? 'rgba(99,102,241,0.2)' : '#eef2ff') : chipBg,
                                            borderColor: !filters.planId ? (isDark ? 'rgba(99,102,241,0.4)' : '#c7d2fe') : chipBorder,
                                        }}
                                        className="px-3 py-2 rounded-lg border"
                                    >
                                        <Text style={{ color: !filters.planId ? (isDark ? '#a5b4fc' : '#4338ca') : textMuted }} className="text-xs font-bold">All Plans</Text>
                                    </Pressable>
                                    {plans.map(p => (
                                        <Pressable
                                            key={p.id}
                                            onPress={() => setFilters({ ...filters, planId: filters.planId === p.id ? null : p.id })}
                                            style={{
                                                backgroundColor: filters.planId === p.id ? '#4f46e5' : chipBg,
                                                borderColor: filters.planId === p.id ? '#4f46e5' : chipBorder,
                                            }}
                                            className="px-3 py-2 rounded-lg border"
                                        >
                                            <Text style={{ color: filters.planId === p.id ? '#ffffff' : textMuted }} className="text-xs font-bold">{p.name}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    <View style={{ backgroundColor: footerBg, borderTopColor: headerBorder }} className="px-6 py-4 border-t flex-row gap-3">
                        <Pressable
                            onPress={handleReset}
                            style={{ backgroundColor: resetBtnBg }}
                            className="flex-1 h-12 rounded-xl items-center justify-center active:opacity-80"
                        >
                            <Text style={{ color: textPrimary }} className="font-bold">Reset</Text>
                        </Pressable>
                        <Pressable
                            onPress={handleApply}
                            className="flex-2 flex-[2] bg-blue-600 h-12 rounded-xl items-center justify-center shadow-lg active:scale-[0.99]"
                        >
                            <Text className="font-bold text-white text-[16px]">Apply Filters</Text>
                        </Pressable>
                    </View>
                </View>
            </View>

            {showStartDatePicker && (
                <DateTimePicker
                    value={filters.dateRange.start || new Date()}
                    mode="date"
                    onChange={(e, date) => {
                        setShowStartDatePicker(false);
                        if (date) setFilters({ ...filters, dateRange: { ...filters.dateRange, start: date } });
                    }}
                />
            )}
            {showEndDatePicker && (
                <DateTimePicker
                    value={filters.dateRange.end || new Date()}
                    mode="date"
                    onChange={(e, date) => {
                        setShowEndDatePicker(false);
                        if (date) setFilters({ ...filters, dateRange: { ...filters.dateRange, end: date } });
                    }}
                />
            )}
        </Modal>
    );
}
