
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
}

export function FilterModal({ visible, onClose, currentFilters, onApply, accounts, members, plans, insets }: FilterModalProps) {
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

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View className="flex-1 bg-black/50 justify-end">
                <Pressable className="flex-1" onPress={onClose} />
                <View
                    style={{ paddingBottom: insets.bottom + 20, maxHeight: '90%' }}
                    className="bg-white rounded-t-[32px] overflow-hidden"
                >
                    <View className="px-6 py-4 border-b border-gray-100 flex-row items-center justify-between">
                        <Text className="text-lg font-bold text-gray-900">Filter Transactions</Text>
                        <Pressable onPress={onClose} className="p-2 bg-gray-100 rounded-full">
                            <X size={20} color="#64748b" />
                        </Pressable>
                    </View>

                    <ScrollView className="px-6" contentContainerStyle={{ paddingVertical: 20 }}>
                        {/* Transaction Type */}
                        <View className="mb-6">
                            <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Type</Text>
                            <View className="flex-row gap-2">
                                {['all', 'income', 'expense', 'transfer'].map((t) => (
                                    <Pressable
                                        key={t}
                                        onPress={() => setFilters({ ...filters, type: t as any })}
                                        className={cn(
                                            "flex-1 py-2.5 rounded-xl items-center border",
                                            filters.type === t ? "bg-gray-900 border-gray-900" : "bg-white border-gray-200"
                                        )}
                                    >
                                        <Text className={cn("text-xs font-bold capitalize", filters.type === t ? "text-white" : "text-gray-600")}>
                                            {t}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        {/* Date Range */}
                        <View className="mb-6">
                            <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Date Range</Text>
                            <View className="flex-row gap-3">
                                <Pressable
                                    onPress={() => setShowStartDatePicker(true)}
                                    className="flex-1 border border-gray-200 rounded-xl p-3 flex-row items-center justify-between"
                                >
                                    <View>
                                        <Text className="text-[10px] text-gray-400 font-medium mb-0.5">Start Date</Text>
                                        <Text className="font-semibold text-gray-900">{formatDate(filters.dateRange.start)}</Text>
                                    </View>
                                    <Calendar size={18} color="#94a3b8" />
                                </Pressable>
                                <Pressable
                                    onPress={() => setShowEndDatePicker(true)}
                                    className="flex-1 border border-gray-200 rounded-xl p-3 flex-row items-center justify-between"
                                >
                                    <View>
                                        <Text className="text-[10px] text-gray-400 font-medium mb-0.5">End Date</Text>
                                        <Text className="font-semibold text-gray-900">{formatDate(filters.dateRange.end)}</Text>
                                    </View>
                                    <Calendar size={18} color="#94a3b8" />
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
                            <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Accounts</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                <Pressable
                                    onPress={() => setFilters({ ...filters, accountId: null })}
                                    className={cn(
                                        "px-4 py-2.5 rounded-xl border flex-row items-center gap-2",
                                        !filters.accountId ? "bg-blue-600 border-blue-600" : "bg-white border-gray-200"
                                    )}
                                >
                                    <Layers size={14} color={!filters.accountId ? "white" : "#64748b"} />
                                    <Text className={cn("font-bold text-xs", !filters.accountId ? "text-white" : "text-gray-600")}>All Accounts</Text>
                                </Pressable>
                                {accounts.map(acc => (
                                    <Pressable
                                        key={acc.id}
                                        onPress={() => setFilters({ ...filters, accountId: filters.accountId === acc.id ? null : acc.id })}
                                        className={cn(
                                            "pl-2 pr-4 py-2 rounded-xl border flex-row items-center gap-2",
                                            filters.accountId === acc.id ? "bg-blue-600 border-blue-600" : "bg-white border-gray-200"
                                        )}
                                    >
                                        <View className="h-6 w-6 rounded-full bg-gray-50 items-center justify-center overflow-hidden border border-gray-100">
                                            {acc.logo ? (
                                                <Image source={{ uri: acc.logo }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
                                            ) : (
                                                <CreditCard size={12} color="#64748b" />
                                            )}
                                        </View>
                                        <Text className={cn("font-bold text-xs", filters.accountId === acc.id ? "text-white" : "text-gray-600")}>{acc.name}</Text>
                                    </Pressable>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Family Members */}
                        <View className="mb-6">
                            <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Family Member</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                                <Pressable
                                    onPress={() => setFilters({ ...filters, memberId: null })}
                                    className="items-center gap-2"
                                >
                                    <View className={cn(
                                        "h-14 w-14 rounded-full items-center justify-center border-2",
                                        !filters.memberId ? "bg-gray-900 border-gray-900" : "bg-white border-gray-200"
                                    )}>
                                        <User size={24} color={!filters.memberId ? "white" : "#94a3b8"} />
                                    </View>
                                    <Text className={cn("text-[10px] font-bold", !filters.memberId ? "text-gray-900" : "text-gray-500")}>Everyone</Text>
                                </Pressable>
                                {members.map(member => (
                                    <Pressable
                                        key={member.id}
                                        onPress={() => setFilters({ ...filters, memberId: filters.memberId === member.id ? null : member.id })}
                                        className="items-center gap-2"
                                    >
                                        <View className={cn(
                                            "h-14 w-14 rounded-full items-center justify-center border-2 overflow-hidden",
                                            filters.memberId === member.id ? "border-blue-600" : "border-gray-200 bg-gray-50"
                                        )}>
                                            <Text className="font-bold text-lg text-gray-400">{(member.name || "?").charAt(0)}</Text>
                                            {filters.memberId === member.id && (
                                                <View className="absolute inset-0 bg-blue-600/20 items-center justify-center">
                                                    <Check size={20} color="#2563eb" strokeWidth={3} />
                                                </View>
                                            )}
                                        </View>
                                        <Text className={cn("text-[10px] font-bold", filters.memberId === member.id ? "text-blue-600" : "text-gray-500")}>
                                            {(member.name || "Unknown").split(' ')[0]}
                                        </Text>
                                    </Pressable>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Plans */}
                        {plans.length > 0 && (
                            <View className="mb-6">
                                <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Planning</Text>
                                <View className="flex-row flex-wrap gap-2">
                                    <Pressable
                                        onPress={() => setFilters({ ...filters, planId: null })}
                                        className={cn(
                                            "px-3 py-2 rounded-lg border",
                                            !filters.planId ? "bg-indigo-50 border-indigo-200" : "bg-white border-gray-200"
                                        )}
                                    >
                                        <Text className={cn("text-xs font-bold", !filters.planId ? "text-indigo-700" : "text-gray-500")}>All Plans</Text>
                                    </Pressable>
                                    {plans.map(p => (
                                        <Pressable
                                            key={p.id}
                                            onPress={() => setFilters({ ...filters, planId: filters.planId === p.id ? null : p.id })}
                                            className={cn(
                                                "px-3 py-2 rounded-lg border",
                                                filters.planId === p.id ? "bg-indigo-600 border-indigo-600" : "bg-white border-gray-200"
                                            )}
                                        >
                                            <Text className={cn("text-xs font-bold", filters.planId === p.id ? "text-white" : "text-gray-500")}>{p.name}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    <View className="px-6 py-4 border-t border-gray-100 flex-row gap-3 bg-white">
                        <Pressable
                            onPress={handleReset}
                            className="flex-1 bg-gray-100 h-12 rounded-xl items-center justify-center active:opacity-80"
                        >
                            <Text className="font-bold text-gray-900">Reset</Text>
                        </Pressable>
                        <Pressable
                            onPress={handleApply}
                            className="flex-2 flex-[2] bg-gray-900 h-12 rounded-xl items-center justify-center shadow-lg active:scale-[0.99]"
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
