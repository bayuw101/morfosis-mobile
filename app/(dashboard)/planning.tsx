import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, RefreshControl, Switch, Modal, KeyboardAvoidingView, Platform, Image, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Plus, Target, Calendar, Trash2, Check, Save, X, Search, ChevronsUpDown, Sparkles, Copy, Users, Pencil, GripVertical, ChevronDown, Edit2 } from "lucide-react-native";
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import DateTimePicker from '@react-native-community/datetimepicker';
import { API_URL } from "../../constants/config";
import { cn } from "../../lib/utils";
import { FamilyManagementModal } from "../../components/family/family-modal";
import { EditProfileModal } from "../../components/edit-profile-modal";
import { AccountManagementModal } from "../../components/accounts/account-modal";
import { useFamily } from "../../context/family-context";
import { useTheme } from "../../context/theme-context";
import { useLanguage } from "../../context/language-context";
import { Button } from "../../components/ui/button";
import { ConfirmationModal } from "../../components/ui/confirmation-modal";
import { ScreenLoader } from "../../components/ui/loaders";
import { StatusBar } from "expo-status-bar";
import { useDashboardStyles } from "../../hooks/use-dashboard-styles";
import { DashboardHeader } from "../../components/dashboard/dashboard-header";
import { DashboardSheet } from "../../components/dashboard/dashboard-sheet";
import { useToast } from "../../components/ui/toast";

// Safe import for Google Signin
let GoogleSignin: any = {
    getTokens: async () => { throw new Error("Google Sign In not initialized") },
};
try {
    const googleModule = require("@react-native-google-signin/google-signin");
    GoogleSignin = googleModule.GoogleSignin;
} catch (e) { }

interface Budget {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    amount: number;
    spent: number;
    item_count: number;
    notes?: string;
    is_default?: boolean;
}

interface Category {
    id: string;
    name: string;
    type: string;
    icon?: string;
}

interface AllocationItem {
    tempId: string;
    category_id: string;
    planned_amount: number;
    notes?: string;
    category_name?: string;
    category_icon?: string;
}

import { getAuthHeader } from "../../lib/auth";

const formatCurrency = (value: number, compact = false): string => {
    if (compact) {
        if (value >= 1000000000) return `Rp ${(value / 1000000000).toFixed(1)}B`;
        if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `Rp ${(value / 1000).toFixed(0)}K`;
    }
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(value).replace('IDR', 'Rp');
};

const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatDateShort = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export default function PlanningScreen() {
    const insets = useSafeAreaInsets();
    const slideAnim = useRef(new Animated.Value(0)).current;
    const { activeFamily, isSwitching } = useFamily();
    // Use Dashboard Styles Hook
    const { isDark, colors } = useDashboardStyles();
    const { t } = useLanguage();
    const toast = useToast();

    // Removed manual color constants as they are now in 'colors'

    const [user, setUser] = useState<any>(null);
    const [familyModalVisible, setFamilyModalVisible] = useState(false);
    const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);

    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [isLoadingForm, setIsLoadingForm] = useState(false);
    const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
    const [formName, setFormName] = useState("");
    const [formStartDate, setFormStartDate] = useState(new Date());
    const [formEndDate, setFormEndDate] = useState(new Date());
    const [formNotes, setFormNotes] = useState("");
    const [formItems, setFormItems] = useState<AllocationItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    const [showCategorySelector, setShowCategorySelector] = useState(false);
    const [currentEditingIndex, setCurrentEditingIndex] = useState<number | null>(null);
    const [categorySearch, setCategorySearch] = useState("");
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

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
            };

            const [budRes, catRes] = await Promise.all([
                fetch(`${API_URL}/mobile/budgets?t=${Date.now()}`, { headers }),
                fetch(`${API_URL}/mobile/categories?t=${Date.now()}`, { headers }),
            ]);

            if (budRes.ok) setBudgets(await budRes.json());
            if (catRes.ok) setCategories(await catRes.json());

        } catch (e) {
            console.error("Fetch error:", e);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        if (!isSwitching) fetchData();
    }, [fetchData, activeFamily, isSwitching]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    const resetForm = useCallback(() => {
        setFormName("");
        setFormStartDate(new Date());
        setFormEndDate(new Date());
        setFormNotes("");
        setFormItems([]);
        setSelectedBudgetId(null);
        setIsLoadingForm(false);
    }, []);

    const handleNewBudget = useCallback(() => {
        resetForm();
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        setFormStartDate(startOfMonth);
        setFormEndDate(endOfMonth);
        setShowForm(true);
    }, [resetForm]);

    const handleEditBudget = useCallback(async (budget: Budget) => {
        resetForm();
        setSelectedBudgetId(budget.id);
        setFormName(budget.name);
        setFormStartDate(new Date(budget.start_date));
        setFormEndDate(new Date(budget.end_date));
        setFormNotes(budget.notes || "");
        setShowForm(true);
        setIsLoadingForm(true);

        try {
            const headers = await getAuthHeader();
            const res = await fetch(`${API_URL}/mobile/budgets/${budget.id}`, { headers });
            if (res.ok) {
                const detail = await res.json();
                setFormItems(
                    (detail.items || []).map((item: any, i: number) => ({
                        tempId: `existing-${item.id || i}`,
                        category_id: item.category_id,
                        planned_amount: Number(item.planned_amount) || 0,
                        notes: item.notes,
                        category_name: item.category_name,
                        category_icon: item.category_icon,
                    }))
                );
            }
        } catch (e) {
            console.error("Fetch budget detail error:", e);
        } finally {
            setIsLoadingForm(false);
        }
    }, [resetForm]);

    const handleDuplicateBudget = useCallback(async (budget: Budget) => {
        resetForm();
        setFormName(`${budget.name} (Copy)`);

        const now = new Date();
        const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);
        setFormStartDate(startOfNextMonth);
        setFormEndDate(endOfNextMonth);
        setFormNotes(budget.notes || "");
        setShowForm(true);
        setIsLoadingForm(true);

        try {
            const headers = await getAuthHeader();
            const res = await fetch(`${API_URL}/mobile/budgets/${budget.id}`, { headers });
            if (res.ok) {
                const detail = await res.json();
                setFormItems(
                    (detail.items || []).map((item: any, i: number) => ({
                        tempId: `new-${Date.now()}-${i}`,
                        category_id: item.category_id,
                        planned_amount: Number(item.planned_amount) || 0,
                        notes: item.notes,
                        category_name: item.category_name,
                        category_icon: item.category_icon,
                    }))
                );
            }
        } catch (e) {
            console.error("Fetch budget detail for duplicate error:", e);
        } finally {
            setIsLoadingForm(false);
        }
    }, [resetForm]);

    const handleCloseForm = useCallback(() => {
        setShowForm(false);
        setTimeout(resetForm, 300);
    }, [resetForm]);

    const handleSave = async () => {
        if (!formName.trim()) {
            toast.show(t('planning.errorPlanName'), 'error');
            return;
        }

        // Validate items
        const validItems = formItems.filter(item => item.category_id && item.category_id.trim() !== "");

        if (validItems.length === 0) {
            toast.show("Please add at least one category allocation", 'error');
            return;
        }

        // Check for duplicates
        const categoryIds = validItems.map(i => i.category_id);
        const uniqueIds = new Set(categoryIds);
        if (uniqueIds.size !== categoryIds.length) {
            toast.show("Duplicate categories are not allowed. Please combine them.", 'error');
            return;
        }

        // Check for positive amounts
        const hasZeroAmount = validItems.some(item => (Number(item.planned_amount) || 0) <= 0);
        if (hasZeroAmount) {
            toast.show("Planned amounts must be greater than 0", 'error');
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
                start_date: formStartDate.toISOString().split('T')[0],
                end_date: formEndDate.toISOString().split('T')[0],
                notes: formNotes.trim() || null,
                items: formItems
                    .filter(item => item.category_id && item.category_id.trim() !== "") // Filter out items without category
                    .map(item => ({
                        category_id: item.category_id,
                        planned_amount: Number(item.planned_amount) || 0,
                        notes: item.notes || null
                    }))
            };

            console.log("Saving Budget Payload:", JSON.stringify(payload, null, 2));

            const isUpdate = !!selectedBudgetId;
            let res;
            if (selectedBudgetId) {
                res = await fetch(`${API_URL}/mobile/budgets/${selectedBudgetId}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch(`${API_URL}/mobile/budgets`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                setShowForm(false);
                resetForm();
                await fetchData();
                toast.show(isUpdate ? t('common.updated') : t('common.created'), 'success');
            } else {
                const err = await res.json();
                console.error("Save failed:", err);
                toast.show(err.details || err.error || t('planning.errorSave'), 'error');
            }
        } catch (e: any) {
            console.error("Save error:", e);
            toast.show(e.message || t('planning.errorNetwork'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedBudgetId) return;
        setShowDeleteModal(true);
    };

    const handleSetDefault = async (budgetId: string) => {
        if (settingDefaultId) return;
        setSettingDefaultId(budgetId);

        setBudgets(prev => prev.map(b => ({
            ...b,
            is_default: b.id === budgetId
        })));

        try {
            const headers = await getAuthHeader();
            await fetch(`${API_URL}/mobile/budgets/${budgetId}/default`, {
                method: 'PUT',
                headers
            });
            await fetchData();
        } catch (e) {
            console.error("Set default error:", e);
            fetchData();
        } finally {
            setSettingDefaultId(null);
        }
    };

    const confirmDelete = async () => {
        if (!selectedBudgetId) return;
        setIsSaving(true);
        try {
            const headers = await getAuthHeader();
            const res = await fetch(`${API_URL}/mobile/budgets/${selectedBudgetId}`, {
                method: 'DELETE',
                headers
            });

            if (res.ok) {
                setShowForm(false);
                resetForm();
                await fetchData();
                setShowDeleteModal(false);
                toast.show(t('common.deleted'), 'success');
            } else {
                toast.show(t('planning.errorDelete'), 'error');
            }
        } catch (e) {
            toast.show(t('planning.errorDelete'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const addAllocation = () => {
        setFormItems([...formItems, {
            tempId: `new-${Date.now()}`,
            category_id: "",
            planned_amount: 0,
        }]);
    };

    const updateAllocation = (index: number, field: string, value: any) => {
        const updated = [...formItems];
        updated[index] = { ...updated[index], [field]: value };
        setFormItems(updated);
    };

    const removeAllocation = (index: number) => {
        setFormItems(formItems.filter((_, i) => i !== index));
    };

    const openCategorySelector = (index: number) => {
        setCurrentEditingIndex(index);
        setCategorySearch("");
        setShowCategorySelector(true);
    };

    const selectCategory = (category: Category) => {
        if (currentEditingIndex !== null) {
            const updated = [...formItems];
            updated[currentEditingIndex] = {
                ...updated[currentEditingIndex],
                category_id: category.id,
                category_name: category.name,
                category_icon: category.icon
            };
            setFormItems(updated);
        }
        setShowCategorySelector(false);
        setCategorySearch("");
    };

    const createCategory = async (name: string) => {
        setIsCreatingCategory(true);
        try {
            const headers = {
                ...(await getAuthHeader()),
                'Content-Type': 'application/json'
            };
            const res = await fetch(`${API_URL}/mobile/categories`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ name, type: 'expense' })
            });
            if (res.ok) {
                const data = await res.json();
                const newCat = data.category;
                setCategories([...categories, newCat]);
                selectCategory(newCat);
            }
        } catch (e) {
            console.error("Create category error:", e);
        } finally {
            setIsCreatingCategory(false);
        }
    };

    const filteredCategories = useMemo(() => {
        const expenseCategories = categories.filter(c => c.type === 'expense' || c.type === 'both');
        if (!categorySearch.trim()) return expenseCategories;
        return expenseCategories.filter(c =>
            c.name.toLowerCase().includes(categorySearch.toLowerCase())
        );
    }, [categories, categorySearch]);

    const showCreateOption = categorySearch.trim() &&
        !filteredCategories.some(c => c.name.toLowerCase() === categorySearch.toLowerCase());

    const totalPlanned = formItems.reduce((sum, item) => sum + (item.planned_amount || 0), 0);
    const totalBudgetAmount = budgets.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
    const totalSpent = budgets.reduce((sum, b) => sum + (Number(b.spent) || 0), 0);

    const getPercentage = (spent: number, planned: number): number => {
        if (planned === 0) return 0;
        return Math.min((spent / planned) * 100, 100);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('greetings.morning');
        if (hour < 17) return t('greetings.afternoon');
        return t('greetings.evening');
    };

    // Loading state
    if (isLoading) {
        return <ScreenLoader message={t('planning.loadingPlans')} />;
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.headerBg }}>
            <StatusBar style="light" />
            {/* Header Section */}
            <View style={{ paddingTop: insets.top }} className="px-6 pb-5">
                <DashboardHeader
                    user={user}
                    activeFamily={activeFamily}
                    onProfilePress={() => setEditProfileModalVisible(true)}
                    onFamilyPress={() => setFamilyModalVisible(true)}
                />

                {/* Summary in Header */}
                <View style={{ backgroundColor: colors.headerCardBg, borderColor: colors.headerCardBorder }} className="rounded-2xl p-4 border">
                    <View className="flex-row items-center gap-2 mb-1">
                        <Target size={14} color="#93c5fd" />
                        <Text style={{ color: colors.headerSubText }} className="text-xs">{t('planning.totalPlannedBudget')}</Text>
                    </View>
                    <Text className="text-2xl font-bold text-white mb-3">{formatCurrency(totalBudgetAmount)}</Text>

                    <View className="flex-row gap-3">
                        <View className="flex-1 bg-white/10 px-3 py-2 rounded-lg">
                            <Text style={{ color: colors.headerSubText }} className="text-[10px] mb-0.5">{t('planning.activePlans')}</Text>
                            <Text className="text-white font-bold">{budgets.length}</Text>
                        </View>
                        <View className="flex-1 bg-white/10 px-3 py-2 rounded-lg">
                            <Text style={{ color: colors.headerSubText }} className="text-[10px] mb-0.5">{t('planning.totalSpent')}</Text>
                            <Text className="text-white font-bold">{formatCurrency(totalSpent, true)}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Content Card - Slides Up */}
            <DashboardSheet
                animatedStyle={{
                    transform: [{
                        translateY: slideAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [50, 0]
                        })
                    }]
                }}
            >

                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
                    contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 120 }}
                >
                    {/* Header Row: Add Button */}
                    <View className="flex-row items-center justify-between mb-4">
                        <Text style={{ color: colors.textPrimary }} className="font-bold text-lg">{t('planning.myPlans')}</Text>
                        <Button
                            label={t('planning.newPlan')}
                            onPress={handleNewBudget}
                            leftIcon={<Plus size={16} color="white" strokeWidth={2.5} />}
                            size="sm"
                            className="bg-blue-600 rounded-xl px-4 border-0"
                        />
                    </View>

                    {/* Budget List */}
                    {budgets.length === 0 ? (
                        <View style={{ backgroundColor: isDark ? '#374151' : '#f8fafc', borderColor: isDark ? '#4b5563' : '#e2e8f0' }} className="items-center py-16 rounded-3xl border border-dashed">
                            <View style={{ backgroundColor: isDark ? '#1f2937' : '#f1f5f9' }} className="h-20 w-20 rounded-full items-center justify-center mb-4">
                                <Sparkles size={32} color={colors.textMuted} />
                            </View>
                            <Text style={{ color: colors.textPrimary }} className="font-bold text-lg mb-1">{t('planning.noPlansYet')}</Text>
                            <Text style={{ color: colors.textSecondary }} className="text-sm text-center mb-6 px-8">
                                {t('planning.createFirst')}
                            </Text>
                            <Button
                                label={t('planning.createPlan')}
                                onPress={handleNewBudget}
                                leftIcon={<Plus size={18} color="white" />}
                                className="bg-blue-600"
                            />
                        </View>
                    ) : (
                        budgets.map((budget) => {
                            const percentage = getPercentage(Number(budget.spent) || 0, Number(budget.amount) || 0);

                            return (
                                <Pressable
                                    key={budget.id}
                                    onPress={() => handleEditBudget(budget)}
                                    style={{
                                        backgroundColor: colors.cardBg,
                                        borderColor: budget.is_default ? (isDark ? '#3b82f6' : '#bfdbfe') : colors.cardBorder,
                                    }}
                                    className="rounded-3xl border mb-3 overflow-hidden"
                                >
                                    {/* Default Indicator Line */}
                                    {budget.is_default && (
                                        <View className="h-1 bg-blue-500" />
                                    )}

                                    <View className="p-4">
                                        <View className="flex-row items-start justify-between mb-3">
                                            <View className="flex-1">
                                                <View className="flex-row items-center gap-2 mb-0.5">
                                                    <Text style={{ color: colors.textPrimary }} className="font-bold text-[15px]">{budget.name}</Text>
                                                    {budget.is_default && (
                                                        <View style={{ backgroundColor: isDark ? 'rgba(59,130,246,0.2)' : '#dbeafe' }} className="px-2 py-0.5 rounded-full">
                                                            <Text style={{ color: isDark ? '#93c5fd' : '#1d4ed8' }} className="text-[9px] font-bold uppercase">{t('planning.default')}</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <Text style={{ color: colors.textMuted }} className="text-xs">
                                                    {formatDateShort(budget.start_date)} – {formatDate(budget.end_date)}
                                                </Text>
                                            </View>

                                            <View className="flex-row items-center gap-2" onTouchEnd={(e) => e.stopPropagation()}>
                                                <Pressable
                                                    onPress={() => handleDuplicateBudget(budget)}
                                                    style={{ backgroundColor: isDark ? '#1f2937' : '#f1f5f9' }}
                                                    className="p-2 rounded-lg active:opacity-70"
                                                >
                                                    <Copy size={14} color={colors.textSecondary} />
                                                </Pressable>
                                                {settingDefaultId === budget.id ? (
                                                    <View className="w-10 h-6 items-center justify-center">
                                                        <ActivityIndicator size="small" color="#3b82f6" />
                                                    </View>
                                                ) : (
                                                    <Switch
                                                        value={!!budget.is_default}
                                                        onValueChange={() => handleSetDefault(budget.id)}
                                                        trackColor={{ false: isDark ? '#4b5563' : '#e2e8f0', true: "#3b82f6" }}
                                                        thumbColor="#ffffff"
                                                        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                                                        disabled={!!settingDefaultId}
                                                    />
                                                )}
                                            </View>
                                        </View>

                                        {/* Progress Section */}
                                        <View style={{ backgroundColor: isDark ? '#1f2937' : '#f8fafc' }} className="rounded-xl px-3 py-2.5">
                                            <View className="flex-row justify-between mb-2">
                                                <Text style={{ color: colors.textSecondary }} className="text-xs">
                                                    {formatCurrency(Number(budget.spent) || 0, true)} {t('planning.spent')}
                                                </Text>
                                                <Text style={{ color: colors.textPrimary }} className="text-xs font-semibold">
                                                    {formatCurrency(Number(budget.amount) || 0, true)}
                                                </Text>
                                            </View>
                                            <View style={{ backgroundColor: isDark ? '#374151' : '#e2e8f0' }} className="h-2 w-full rounded-full overflow-hidden">
                                                <View
                                                    className={cn(
                                                        "h-full rounded-full",
                                                        percentage > 90 ? "bg-red-500" : percentage > 70 ? "bg-amber-500" : "bg-blue-500"
                                                    )}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                </Pressable>
                            );
                        })
                    )}
                </ScrollView>
            </DashboardSheet>

            {/* Form Modal */}
            <Modal visible={showForm} animationType="slide" transparent>
                <GestureHandlerRootView style={{ flex: 1 }} className="bg-black/50">
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        className="flex-1 justify-end"
                    >
                        <View style={{ backgroundColor: colors.modalBg, paddingBottom: insets.bottom }} className="rounded-t-[32px] h-[85%]">
                            {/* Form Header */}
                            <View style={{ borderBottomColor: colors.modalHeaderBorder }} className="flex-row items-center justify-between p-5 border-b">
                                <View className="flex-row items-center gap-3">
                                    <Pressable onPress={handleCloseForm} style={{ backgroundColor: colors.closeBtnBg }} className="p-2 rounded-full">
                                        <X size={18} color={colors.textSecondary} />
                                    </Pressable>
                                    <View>
                                        <Text style={{ color: colors.textPrimary }} className="text-xl font-bold">
                                            {selectedBudgetId ? t('planning.editPlan') : t('planning.newPlan')}
                                        </Text>
                                        {totalPlanned > 0 && (
                                            <Text style={{ color: colors.textSecondary }} className="text-xs">
                                                {t('planning.total')}: {formatCurrency(totalPlanned)}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                                <View className="flex-row items-center gap-2">
                                    {selectedBudgetId && (
                                        <Pressable
                                            onPress={() => setShowDeleteModal(true)}
                                            style={{ backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#fef2f2' }}
                                            className="p-2 rounded-full active:opacity-70"
                                        >
                                            <Trash2 size={18} color="#ef4444" />
                                        </Pressable>
                                    )}
                                    <Button
                                        label={t('common.save')}
                                        onPress={handleSave}
                                        isLoading={isSaving}
                                        disabled={!formName.trim()}
                                        className="bg-blue-600 rounded-full"
                                        size="sm"
                                    />
                                </View>
                            </View>

                            {/* Form Content */}
                            {isLoadingForm ? (
                                <View className="h-64 items-center justify-center">
                                    <ActivityIndicator size="large" color="#3b82f6" />
                                    <Text style={{ color: colors.textSecondary }} className="mt-3 text-sm">{t('planning.loadingPlanDetails')}</Text>
                                </View>
                            ) : (
                                <DraggableFlatList
                                    data={formItems}
                                    onDragEnd={({ data }) => setFormItems(data)}
                                    keyExtractor={(item) => item.tempId}
                                    containerStyle={{ flex: 1 }}
                                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                                    keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                                    keyboardShouldPersistTaps="handled"
                                    ListHeaderComponent={
                                        <>
                                            {/* Plan Name */}
                                            <View className="mb-6">
                                                <Text style={{ color: colors.textMuted }} className="text-[11px] font-bold uppercase tracking-widest mb-2 ml-1">{t('planning.planName')}</Text>
                                                <TextInput
                                                    style={{ backgroundColor: colors.modalInputBg, borderColor: colors.modalInputBorder, color: colors.textPrimary }}
                                                    className="border rounded-2xl px-4 py-4 text-lg font-semibold"
                                                    placeholder={t('planning.planNamePlaceholder')}
                                                    placeholderTextColor={colors.textMuted}
                                                    value={formName}
                                                    onChangeText={setFormName}
                                                />
                                            </View>

                                            {/* Duration */}
                                            <View className="mb-8">
                                                <Text style={{ color: colors.textMuted }} className="text-[11px] font-bold uppercase tracking-widest mb-2 ml-1">{t('planning.frequencyDuration')}</Text>
                                                <View className="flex-row gap-3">
                                                    <Pressable
                                                        onPress={() => setShowStartDatePicker(true)}
                                                        style={{ backgroundColor: colors.modalInputBg, borderColor: colors.modalInputBorder }}
                                                        className="flex-1 border rounded-2xl p-4 flex-row items-center gap-3 active:opacity-80"
                                                    >
                                                        <View style={{ backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#dbeafe' }} className="h-10 w-10 rounded-full items-center justify-center">
                                                            <Calendar size={18} color="#2563eb" />
                                                        </View>
                                                        <View>
                                                            <Text style={{ color: colors.textMuted }} className="text-[10px] font-bold uppercase mb-0.5">{t('planning.startDate')}</Text>
                                                            <Text style={{ color: colors.textPrimary }} className="font-bold text-sm">
                                                                {formStartDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </Text>
                                                        </View>
                                                    </Pressable>
                                                    <Pressable
                                                        onPress={() => setShowEndDatePicker(true)}
                                                        style={{ backgroundColor: colors.modalInputBg, borderColor: colors.modalInputBorder }}
                                                        className="flex-1 border rounded-2xl p-4 flex-row items-center gap-3 active:opacity-80"
                                                    >
                                                        <View style={{ backgroundColor: isDark ? 'rgba(147,51,234,0.15)' : '#f3e8ff' }} className="h-10 w-10 rounded-full items-center justify-center">
                                                            <Calendar size={18} color="#9333ea" />
                                                        </View>
                                                        <View>
                                                            <Text style={{ color: colors.textMuted }} className="text-[10px] font-bold uppercase mb-0.5">{t('planning.endDate')}</Text>
                                                            <Text style={{ color: colors.textPrimary }} className="font-bold text-sm">
                                                                {formEndDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </Text>
                                                        </View>
                                                    </Pressable>
                                                </View>
                                            </View>

                                            {/* Budgets Header */}
                                            <View className="mb-3 mt-2">
                                                <Text style={{ color: colors.textPrimary }} className="text-sm font-bold">{t('planning.categoryAllocations')}</Text>
                                            </View>
                                        </>
                                    }
                                    renderItem={({ item, drag, isActive, getIndex }) => {
                                        const index = getIndex();
                                        return (
                                            <ScaleDecorator>
                                                <View style={{
                                                    backgroundColor: colors.cardBg,
                                                    borderColor: isActive ? '#3b82f6' : colors.cardBorder,
                                                }} className={cn(
                                                    "border rounded-2xl p-4 mb-3 relative flex-row items-start gap-3",
                                                    isActive && "shadow-xl z-10"
                                                )}>
                                                    {/* Drag Handle */}
                                                    <Pressable onPressIn={drag} className="py-2 pr-2 -ml-2">
                                                        <GripVertical size={20} color={colors.textMuted} />
                                                    </Pressable>

                                                    <View className="flex-1 gap-3">
                                                        {/* Category Selector */}
                                                        <Pressable
                                                            onPress={() => openCategorySelector(index!)}
                                                            style={{ backgroundColor: colors.modalInputBg, borderColor: colors.modalInputBorder }}
                                                            className="flex-row items-center justify-between border rounded-xl px-3 h-12"
                                                        >
                                                            <Text style={{ color: item.category_name ? colors.textPrimary : colors.textMuted }} className="text-sm font-medium">
                                                                {item.category_name || t('planning.selectCategory')}
                                                            </Text>
                                                            <ChevronsUpDown size={14} color={colors.textMuted} />
                                                        </Pressable>

                                                        {/* Amount */}
                                                        <View style={{ backgroundColor: colors.modalInputBg, borderColor: colors.modalInputBorder }} className="flex-row items-center border rounded-xl px-3 h-12">
                                                            <Text style={{ color: colors.textSecondary }} className="font-bold mr-2">Rp</Text>
                                                            <TextInput
                                                                style={{ color: colors.textPrimary }}
                                                                className="flex-1 font-bold text-base"
                                                                placeholder={t('planning.allocations')}
                                                                placeholderTextColor={colors.textMuted}
                                                                keyboardType="numeric"
                                                                value={item.planned_amount ? new Intl.NumberFormat("id-ID").format(item.planned_amount) : ""}
                                                                onChangeText={(text) => {
                                                                    const digits = text.replace(/\D/g, "");
                                                                    updateAllocation(index!, 'planned_amount', digits ? Number(digits) : 0);
                                                                }}
                                                            />
                                                        </View>
                                                    </View>

                                                    {/* Delete Button */}
                                                    <Pressable
                                                        onPress={() => removeAllocation(index!)}
                                                        className="p-2 -mr-2 -mt-2 opacity-50 active:opacity-100"
                                                    >
                                                        <X size={16} color="#ef4444" />
                                                    </Pressable>
                                                </View>
                                            </ScaleDecorator>
                                        )
                                    }}
                                    ListFooterComponent={
                                        <View className="mt-2 mb-8">
                                            {/* Add Allocation Button */}
                                            <Pressable
                                                onPress={addAllocation}
                                                style={{ borderColor: isDark ? '#4b5563' : '#e2e8f0' }}
                                                className="border-2 border-dashed rounded-2xl py-5 items-center justify-center flex-row gap-2 active:opacity-70 mb-6"
                                            >
                                                <Plus size={18} color={colors.textMuted} />
                                                <Text style={{ color: colors.textMuted }} className="font-bold uppercase tracking-wider text-xs">{t('planning.addAllocations')}</Text>
                                            </Pressable>

                                            {/* Summary Card */}
                                            <View style={{ backgroundColor: colors.modalInputBg, borderColor: colors.modalInputBorder }} className="border rounded-2xl p-4 mb-6 flex-row items-center justify-between">
                                                <View className="flex-row items-center gap-2">
                                                    <View style={{ backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#dbeafe' }} className="p-2 rounded-full">
                                                        <Target size={16} color="#2563eb" />
                                                    </View>
                                                    <Text style={{ color: colors.textSecondary }} className="font-bold text-xs uppercase tracking-wider">{t('planning.totalAllocated')}</Text>
                                                </View>
                                                <Text style={{ color: colors.textPrimary }} className="font-bold text-lg">{formatCurrency(totalPlanned)}</Text>
                                            </View>

                                            <Text style={{ color: colors.textMuted }} className="text-[11px] font-bold uppercase tracking-widest mb-2 ml-1">{t('planning.overallNotes')}</Text>
                                            <TextInput
                                                style={{ backgroundColor: colors.modalInputBg, borderColor: colors.modalInputBorder, color: colors.textPrimary }}
                                                className="border rounded-2xl px-4 py-3.5 text-sm h-24"
                                                placeholder={t('planning.notesPlaceholder')}
                                                placeholderTextColor={colors.textMuted}
                                                value={formNotes}
                                                onChangeText={setFormNotes}
                                                multiline
                                                textAlignVertical="top"
                                            />
                                        </View>
                                    }
                                />
                            )}
                        </View>
                    </KeyboardAvoidingView>
                </GestureHandlerRootView>
            </Modal>

            {/* Category Selector Modal */}
            <Modal visible={showCategorySelector} animationType="slide" transparent>
                <View className="flex-1 bg-black/50 justify-end">
                    <View style={{ backgroundColor: colors.modalBg, paddingBottom: insets.bottom }} className="rounded-t-[32px] h-[70%]">
                        <View style={{ borderBottomColor: colors.modalHeaderBorder }} className="p-5 border-b flex-row items-center justify-between">
                            <Text style={{ color: colors.textPrimary }} className="text-lg font-bold">{t('planning.selectCategory')}</Text>
                            <Pressable onPress={() => setShowCategorySelector(false)} style={{ backgroundColor: colors.closeBtnBg }} className="p-2 rounded-full">
                                <X size={16} color={colors.textSecondary} />
                            </Pressable>
                        </View>

                        <View className="px-5 py-3">
                            <View style={{ backgroundColor: colors.modalInputBg, borderColor: colors.modalInputBorder }} className="flex-row items-center border rounded-xl px-3 h-11">
                                <Search size={16} color={colors.textMuted} />
                                <TextInput
                                    style={{ color: colors.textPrimary }}
                                    className="flex-1 ml-3"
                                    placeholder={t('planning.searchCategories')}
                                    placeholderTextColor={colors.textMuted}
                                    value={categorySearch}
                                    onChangeText={setCategorySearch}
                                    autoFocus
                                />
                            </View>
                        </View>

                        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
                            {showCreateOption && (
                                <Pressable
                                    onPress={() => createCategory(categorySearch)}
                                    style={{ backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff' }}
                                    className="flex-row items-center gap-3 p-4 rounded-2xl mb-2"
                                >
                                    <View style={{ backgroundColor: isDark ? 'rgba(59,130,246,0.2)' : '#dbeafe' }} className="h-10 w-10 rounded-full items-center justify-center">
                                        {isCreatingCategory ? <ActivityIndicator size="small" color="#2563eb" /> : <Plus size={20} color="#2563eb" />}
                                    </View>
                                    <View>
                                        <Text style={{ color: isDark ? '#93c5fd' : '#1d4ed8' }} className="font-bold">{t('planning.createCategory')} "{categorySearch}"</Text>
                                        <Text style={{ color: isDark ? '#60a5fa' : '#3b82f6' }} className="text-xs">{t('planning.tapToCreate')}</Text>
                                    </View>
                                </Pressable>
                            )}

                            {filteredCategories.map((cat) => (
                                <Pressable
                                    key={cat.id}
                                    onPress={() => selectCategory(cat)}
                                    style={{ borderBottomColor: colors.divider }}
                                    className="flex-row items-center gap-3 p-4 border-b active:opacity-70"
                                >
                                    <View style={{ backgroundColor: isDark ? '#374151' : '#f1f5f9' }} className="h-10 w-10 rounded-full items-center justify-center">
                                        <Text className="text-lg">{cat.icon || "🏷️"}</Text>
                                    </View>
                                    <Text style={{ color: colors.textPrimary }} className="font-semibold text-sm">{cat.name}</Text>
                                </Pressable>
                            ))}
                            <View className="h-10" />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Date Pickers */}
            {showStartDatePicker && (
                <DateTimePicker
                    value={formStartDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                        setShowStartDatePicker(false);
                        if (selectedDate) setFormStartDate(selectedDate);
                    }}
                />
            )}
            {showEndDatePicker && (
                <DateTimePicker
                    value={formEndDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                        setShowEndDatePicker(false);
                        if (selectedDate) setFormEndDate(selectedDate);
                    }}
                />
            )}

            {familyModalVisible && (
                <FamilyManagementModal
                    visible={familyModalVisible}
                    onClose={() => setFamilyModalVisible(false)}
                    currentUserId={user?.id}
                    onFamilyUpdated={fetchData}
                />
            )}

            {editProfileModalVisible && (
                <EditProfileModal
                    visible={editProfileModalVisible}
                    onClose={() => setEditProfileModalVisible(false)}
                    onSuccess={(u) => { setUser(u); setEditProfileModalVisible(false); }}
                    currentUser={user}
                />
            )}
            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                visible={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title={t('planning.deletePlan')}
                message={`${t('planning.deletePlanConfirm')}`}
                confirmText={t('common.delete')}
                variant="danger"
                isLoading={isSaving}
            />

        </View>
    );
}
