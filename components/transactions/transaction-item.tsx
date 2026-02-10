
import React from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { ArrowUpRight, ArrowDownLeft, ArrowRightLeft, Trash2 } from 'lucide-react-native';
import { cn } from '../../lib/utils';


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

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID').format(value);
};

interface TransactionItemProps {
    transaction: Transaction;
    isLast: boolean;
    onDelete: (tx: Transaction) => void;
    isDark?: boolean;
}

export const TransactionItem = ({ transaction, isLast, onDelete, isDark = false }: TransactionItemProps) => {
    const getTypeConfig = () => {
        switch (transaction.type) {
            case 'income': return {
                icon: ArrowDownLeft,
                color: '#22c55e',
                bgColor: isDark ? 'rgba(34,197,94,0.15)' : '#dcfce7',
                prefix: '+'
            };
            case 'transfer': return {
                icon: ArrowRightLeft,
                color: '#3b82f6',
                bgColor: isDark ? 'rgba(59,130,246,0.15)' : '#dbeafe',
                prefix: ''
            };
            default: return {
                icon: ArrowUpRight,
                color: '#ef4444',
                bgColor: isDark ? 'rgba(239,68,68,0.15)' : '#fee2e2',
                prefix: '-'
            };
        }
    };
    const config = getTypeConfig();
    const Icon = config.icon;

    const textPrimary = isDark ? '#f9fafb' : '#0f172a';
    const textMuted = isDark ? '#6b7280' : '#94a3b8';
    const dotColor = isDark ? '#4b5563' : '#d1d5db';
    const dividerColor = isDark ? '#4b5563' : '#f1f5f9';
    const bgColor = isDark ? '#374151' : '#ffffff';
    const activeBg = isDark ? '#4b5563' : '#f8fafc';

    const renderRightActions = (progress: any, dragX: any) => {
        const trans = dragX.interpolate({
            inputRange: [-100, 0],
            outputRange: [0, 100],
            extrapolate: 'clamp',
        });

        return (
            <View className="items-center justify-center w-[80px] bg-red-500 rounded-r-3xl my-[1px]">
                <Animated.View style={{ transform: [{ translateX: trans }] }}>
                    <Trash2 size={24} color="white" />
                </Animated.View>
            </View>
        );
    };

    return (
        <Swipeable
            renderRightActions={renderRightActions}
            onSwipeableOpen={() => onDelete(transaction)}
            containerStyle={{ overflow: 'hidden' }}
        >
            <View
                style={{
                    backgroundColor: bgColor,
                    borderBottomColor: !isLast ? dividerColor : 'transparent',
                    borderBottomWidth: !isLast ? 1 : 0,
                }}
                className="flex-row items-center px-4 py-3.5"
            >
                <View className="h-11 w-11 rounded-2xl items-center justify-center mr-3" style={{ backgroundColor: config.bgColor }}>
                    {transaction.category?.icon ? <Text className="text-xl">{transaction.category.icon}</Text> : <Icon size={18} color={config.color} strokeWidth={2.5} />}
                </View>
                <View className="flex-1 mr-3">
                    <Text style={{ color: textPrimary }} className="font-semibold text-[14px] mb-0.5" numberOfLines={1}>{transaction.description || transaction.category?.name || "Transaction"}</Text>
                    <View className="flex-row items-center">
                        <Text style={{ color: textMuted }} className="text-[10px] font-medium">{new Date(transaction.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</Text>
                        {transaction.account && (
                            <><View style={{ backgroundColor: dotColor }} className="w-0.5 h-0.5 rounded-full mx-1.5" /><Text style={{ color: textMuted }} className="text-[10px] font-medium" numberOfLines={1}>{transaction.account.name}</Text></>
                        )}
                        {transaction.type === 'transfer' && transaction.to_account && (
                            <><Text style={{ color: textMuted }} className="text-[10px] font-medium mx-1">→</Text><Text style={{ color: textMuted }} className="text-[10px] font-medium" numberOfLines={1}>{transaction.to_account.name}</Text></>
                        )}
                    </View>
                </View>
                <View className="items-end">
                    <Text
                        className="font-bold text-[14px]"
                        style={{ color: transaction.type === 'expense' ? (isDark ? '#f9fafb' : '#0f172a') : config.color }}
                    >
                        {config.prefix}Rp{formatCurrency(Math.abs(transaction.amount))}
                    </Text>
                </View>
            </View>
        </Swipeable>
    );
};
