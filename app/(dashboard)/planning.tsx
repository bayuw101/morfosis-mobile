import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, RefreshControl, Switch, Alert, Modal, KeyboardAvoidingView, Platform, Image, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Plus, Target, Calendar, Trash2, Check, Save, X, Search, ChevronsUpDown, Sparkles, Copy, Users, Pencil, GripVertical, ChevronDown } from "lucide-react-native";
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import DateTimePicker from '@react-native-community/datetimepicker';
import { API_URL } from "../../constants/config";
import { cn } from "../../lib/utils";
import { FamilyManagementModal } from "../../components/family/family-modal";
import { EditProfileModal } from "../../components/edit-profile-modal";
import { AccountManagementModal } from "../../components/accounts/account-modal";
import { useFamily } from "../../context/family-context";
import { Button } from "../../components/ui/button";
import { ConfirmationModal } from "../../components/ui/confirmation-modal";
import { ScreenLoader } from "../../components/ui/loaders";

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

    // Use Global Family Context
    const { activeFamily, isSwitching } = useFamily();

    // User state
    const [user, setUser] = useState<any>(null);
    // Removed local activeFamilyName state

    const [familyModalVisible, setFamilyModalVisible] = useState(false);
    const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);

    // List state
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [isLoadingForm, setIsLoadingForm] = useState(false);
    const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
    const [formName, setFormName] = useState("");
    const [formStartDate, setFormStartDate] = useState(new Date());
    const [formEndDate, setFormEndDate] = useState(new Date());
    const [formNotes, setFormNotes] = useState("");
    const [formItems, setFormItems] = useState<AllocationItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Date picker state
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    // Category selector state
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
                // Remove fetch families
            ]);

            if (budRes.ok) setBudgets(await budRes.json());
            if (catRes.ok) setCategories(await catRes.json());

            // Remove activeFamilyName processing logic

        } catch (e) {
            console.error("Fetch error:", e);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Initial fetch only when not switching
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
        // Set default dates to current month
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

        // Fetch budget detail for allocations
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

        // Set dates to next month
        const now = new Date();
        const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);
        setFormStartDate(startOfNextMonth);
        setFormEndDate(endOfNextMonth);
        setFormNotes(budget.notes || "");
        setShowForm(true);
        setIsLoadingForm(true);

        // Fetch and copy allocations
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
        // Delay reset to allow modal close animation
        setTimeout(resetForm, 300);
    }, [resetForm]);

    const handleSave = async () => {
        if (!formName.trim()) {
            Alert.alert("Error", "Please enter a plan name");
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
                items: formItems.map(item => ({
                    category_id: item.category_id,
                    planned_amount: item.planned_amount,
                    notes: item.notes || null
                }))
            };

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
            } else {
                const err = await res.json();
                Alert.alert("Error", err.error || "Failed to save");
            }
        } catch (e) {
            console.error("Save error:", e);
            Alert.alert("Error", "Network error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedBudgetId) return;
        setShowDeleteModal(true);
    };

    const handleSetDefault = async (budgetId: string) => {
        if (settingDefaultId) return; // Prevent multiple calls
        setSettingDefaultId(budgetId);

        // Optimistically update UI immediately
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
            fetchData(); // Revert
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
            } else {
                Alert.alert("Error", "Failed to delete plan");
            }
        } catch (e) {
            Alert.alert("Error", "Failed to delete plan");
        } finally {
            setIsSaving(false);
        }
    };


    // Allocation functions
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
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    // Loading state
    if (isLoading) {
        return <ScreenLoader message="Loading plans..." />;
    }

    return (
        <View className="flex-1 bg-gray-900">
            {/* Dark Header Section */}
            <View style={{ paddingTop: insets.top }} className="bg-gray-900 px-6 pb-5">
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
                                <Pencil size={11} color="#6b7280" />
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

                {/* Summary in Dark Header */}
                <View className="bg-gray-800/60 rounded-2xl p-4 border border-gray-700/50">
                    <View className="flex-row items-center gap-2 mb-1">
                        <Target size={14} color="#60a5fa" />
                        <Text className="text-gray-400 text-xs">Total Planned Budget</Text>
                    </View>
                    <Text className="text-2xl font-bold text-white mb-3">{formatCurrency(totalBudgetAmount)}</Text>

                    <View className="flex-row gap-3">
                        <View className="flex-1 bg-white/10 px-3 py-2 rounded-lg">
                            <Text className="text-gray-400 text-[10px] mb-0.5">Active Plans</Text>
                            <Text className="text-white font-bold">{budgets.length}</Text>
                        </View>
                        <View className="flex-1 bg-white/10 px-3 py-2 rounded-lg">
                            <Text className="text-gray-400 text-[10px] mb-0.5">Total Spent</Text>
                            <Text className="text-white font-bold">{formatCurrency(totalSpent, true)}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Content Card - Slides Up */}
            <Animated.View
                className="flex-1 bg-white rounded-t-[28px] overflow-hidden"
                style={{
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
                    <View className="w-10 h-1 bg-gray-300 rounded-full" />
                </View>

                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
                    contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 120 }}
                >
                    {/* Header Row: Add Button */}
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-gray-900 font-bold text-lg">My Plans</Text>
                        <Button
                            label="New Plan"
                            onPress={handleNewBudget}
                            leftIcon={<Plus size={16} color="white" strokeWidth={2.5} />}
                            size="sm"
                            className="bg-blue-600 rounded-xl px-4"
                        />
                    </View>

                    {/* Budget List */}
                    {budgets.length === 0 ? (
                        <View className="items-center py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                            <View className="h-20 w-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                                <Sparkles size={32} color="#9ca3af" />
                            </View>
                            <Text className="text-gray-900 font-bold text-lg mb-1">No Plans Yet</Text>
                            <Text className="text-gray-500 text-sm text-center mb-6 px-8">
                                Create your first spending plan to start budgeting
                            </Text>
                            <Button
                                label="Create Plan"
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
                                    className={cn(
                                        "bg-white rounded-3xl border mb-3 overflow-hidden shadow-sm",
                                        budget.is_default ? "border-blue-200" : "border-gray-100"
                                    )}
                                >
                                    {/* Default Indicator Line */}
                                    {budget.is_default && (
                                        <View className="h-1 bg-blue-500" />
                                    )}

                                    <View className="p-4">
                                        <View className="flex-row items-start justify-between mb-3">
                                            <View className="flex-1">
                                                <View className="flex-row items-center gap-2 mb-0.5">
                                                    <Text className="font-bold text-gray-900 text-[15px]">{budget.name}</Text>
                                                    {budget.is_default && (
                                                        <View className="bg-blue-100 px-2 py-0.5 rounded-full">
                                                            <Text className="text-blue-700 text-[9px] font-bold uppercase">Default</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <Text className="text-gray-400 text-xs">
                                                    {formatDateShort(budget.start_date)} – {formatDate(budget.end_date)}
                                                </Text>
                                            </View>

                                            <View className="flex-row items-center gap-2" onTouchEnd={(e) => e.stopPropagation()}>
                                                <Pressable
                                                    onPress={() => handleDuplicateBudget(budget)}
                                                    className="p-2 bg-gray-100 rounded-lg active:bg-gray-200"
                                                >
                                                    <Copy size={14} color="#6b7280" />
                                                </Pressable>
                                                {settingDefaultId === budget.id ? (
                                                    <View className="w-10 h-6 items-center justify-center">
                                                        <ActivityIndicator size="small" color="#3b82f6" />
                                                    </View>
                                                ) : (
                                                    <Switch
                                                        value={!!budget.is_default}
                                                        onValueChange={() => handleSetDefault(budget.id)}
                                                        trackColor={{ false: "#e2e8f0", true: "#3b82f6" }}
                                                        thumbColor="#ffffff"
                                                        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                                                        disabled={!!settingDefaultId}
                                                    />
                                                )}
                                            </View>
                                        </View>

                                        {/* Progress Section */}
                                        <View className="bg-gray-50 rounded-xl px-3 py-2.5">
                                            <View className="flex-row justify-between mb-2">
                                                <Text className="text-gray-500 text-xs">
                                                    {formatCurrency(Number(budget.spent) || 0, true)} spent
                                                </Text>
                                                <Text className="text-gray-700 text-xs font-semibold">
                                                    {formatCurrency(Number(budget.amount) || 0, true)}
                                                </Text>
                                            </View>
                                            <View className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
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
            </Animated.View>

            {/* Form Modal */}
            <Modal visible={showForm} animationType="slide" transparent>
                <GestureHandlerRootView style={{ flex: 1 }} className="bg-black/50">
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        className="flex-1 justify-end"
                    >
                        <View className="bg-white rounded-t-[32px] h-[85%]" style={{ paddingBottom: insets.bottom }}>
                            {/* Form Header */}
                            <View className="flex-row items-center justify-between p-5 border-b border-gray-100">
                                <View className="flex-row items-center gap-3">
                                    <Pressable onPress={handleCloseForm} className="bg-gray-100 p-2 rounded-full">
                                        <X size={18} color="#374151" />
                                    </Pressable>
                                    <View>
                                        <Text className="text-xl font-bold text-gray-900">
                                            {selectedBudgetId ? "Edit Plan" : "New Plan"}
                                        </Text>
                                        {totalPlanned > 0 && (
                                            <Text className="text-gray-500 text-xs">
                                                Total: {formatCurrency(totalPlanned)}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                                <View className="flex-row items-center gap-2">
                                    {selectedBudgetId && (
                                        <Pressable
                                            onPress={() => setShowDeleteModal(true)}
                                            className="p-2 bg-red-50 rounded-full active:bg-red-100"
                                        >
                                            <Trash2 size={18} color="#ef4444" />
                                        </Pressable>
                                    )}
                                    <Button
                                        label="Save"
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
                                    <Text className="text-gray-500 mt-3 text-sm">Loading plan details...</Text>
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
                                                <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Plan Name</Text>
                                                <TextInput
                                                    className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-gray-900 text-lg font-semibold"
                                                    placeholder="e.g. January 2026, Bali Trip"
                                                    placeholderTextColor="#9ca3af"
                                                    value={formName}
                                                    onChangeText={setFormName}
                                                />
                                            </View>

                                            {/* Duration */}
                                            <View className="mb-8">
                                                <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Frequency / Duration</Text>
                                                <View className="flex-row gap-3">
                                                    <Pressable
                                                        onPress={() => setShowStartDatePicker(true)}
                                                        className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-4 flex-row items-center gap-3 active:bg-blue-50 active:border-blue-200"
                                                    >
                                                        <View className="h-10 w-10 bg-blue-100 rounded-full items-center justify-center">
                                                            <Calendar size={18} color="#2563eb" />
                                                        </View>
                                                        <View>
                                                            <Text className="text-gray-400 text-[10px] font-bold uppercase mb-0.5">Start Date</Text>
                                                            <Text className="text-gray-900 font-bold text-sm">
                                                                {formStartDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </Text>
                                                        </View>
                                                    </Pressable>
                                                    <Pressable
                                                        onPress={() => setShowEndDatePicker(true)}
                                                        className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-4 flex-row items-center gap-3 active:bg-blue-50 active:border-blue-200"
                                                    >
                                                        <View className="h-10 w-10 bg-purple-100 rounded-full items-center justify-center">
                                                            <Calendar size={18} color="#9333ea" />
                                                        </View>
                                                        <View>
                                                            <Text className="text-gray-400 text-[10px] font-bold uppercase mb-0.5">End Date</Text>
                                                            <Text className="text-gray-900 font-bold text-sm">
                                                                {formEndDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </Text>
                                                        </View>
                                                    </Pressable>
                                                </View>
                                            </View>

                                            {/* Budgets Header */}
                                            <View className="mb-3 mt-2">
                                                <Text className="text-sm font-bold text-gray-700">Category Allocations</Text>
                                            </View>


                                        </>
                                    }
                                    renderItem={({ item, drag, isActive, getIndex }) => {
                                        const index = getIndex();
                                        return (
                                            <ScaleDecorator>
                                                <View className={cn(
                                                    "bg-white border rounded-2xl p-4 mb-3 relative flex-row items-start gap-3",
                                                    isActive ? "border-blue-500 shadow-xl z-10" : "border-gray-100 shadow-sm"
                                                )}>
                                                    {/* Drag Handle */}
                                                    <Pressable onPressIn={drag} className="py-2 pr-2 -ml-2">
                                                        <GripVertical size={20} color="#9ca3af" />
                                                    </Pressable>

                                                    <View className="flex-1 gap-3">
                                                        {/* Category Selector */}
                                                        <Pressable
                                                            onPress={() => openCategorySelector(index!)}
                                                            className="flex-row items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-3 h-12"
                                                        >
                                                            <Text className={cn("text-sm font-medium", item.category_name ? "text-gray-900" : "text-gray-400")}>
                                                                {item.category_name || "Select Category"}
                                                            </Text>
                                                            <ChevronsUpDown size={14} color="#9ca3af" />
                                                        </Pressable>

                                                        {/* Amount */}
                                                        <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3 h-12">
                                                            <Text className="text-gray-500 font-bold mr-2">Rp</Text>
                                                            <TextInput
                                                                className="flex-1 text-gray-900 font-bold text-base"
                                                                placeholder="Allocations"
                                                                placeholderTextColor="#9ca3af"
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
                                                className="border-2 border-dashed border-gray-200 rounded-2xl py-5 items-center justify-center flex-row gap-2 active:bg-gray-50 mb-6"
                                            >
                                                <Plus size={18} color="#9ca3af" />
                                                <Text className="text-gray-400 font-bold uppercase tracking-wider text-xs">Add Allocations</Text>
                                            </Pressable>

                                            {/* Summary Card */}
                                            <View className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6 flex-row items-center justify-between">
                                                <View className="flex-row items-center gap-2">
                                                    <View className="bg-blue-100 p-2 rounded-full">
                                                        <Target size={16} color="#2563eb" />
                                                    </View>
                                                    <Text className="text-gray-500 font-bold text-xs uppercase tracking-wider">Total Allocated</Text>
                                                </View>
                                                <Text className="text-gray-900 font-bold text-lg">{formatCurrency(totalPlanned)}</Text>
                                            </View>

                                            <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Overall Notes (Optional)</Text>
                                            <TextInput
                                                className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-gray-900 text-sm h-24"
                                                placeholder="Add notes about this plan..."
                                                placeholderTextColor="#9ca3af"
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
                    <View className="bg-white rounded-t-[32px] h-[70%]" style={{ paddingBottom: insets.bottom }}>
                        <View className="p-5 border-b border-gray-100 flex-row items-center justify-between">
                            <Text className="text-lg font-bold text-gray-900">Select Category</Text>
                            <Pressable onPress={() => setShowCategorySelector(false)} className="bg-gray-100 p-2 rounded-full">
                                <X size={16} color="#374151" />
                            </Pressable>
                        </View>

                        <View className="px-5 py-3">
                            <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3 h-11">
                                <Search size={16} color="#9ca3af" />
                                <TextInput
                                    className="flex-1 ml-3 text-gray-900"
                                    placeholder="Search categories..."
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
                                    className="flex-row items-center gap-3 p-4 bg-blue-50 rounded-2xl mb-2"
                                >
                                    <View className="h-10 w-10 bg-blue-100 rounded-full items-center justify-center">
                                        {isCreatingCategory ? <ActivityIndicator size="small" color="#2563eb" /> : <Plus size={20} color="#2563eb" />}
                                    </View>
                                    <View>
                                        <Text className="font-bold text-blue-700">Create "{categorySearch}"</Text>
                                        <Text className="text-xs text-blue-500">Tap to create this new category</Text>
                                    </View>
                                </Pressable>
                            )}

                            {filteredCategories.map((cat) => (
                                <Pressable
                                    key={cat.id}
                                    onPress={() => selectCategory(cat)}
                                    className="flex-row items-center gap-3 p-4 border-b border-gray-50 active:bg-gray-50"
                                >
                                    <View className="h-10 w-10 bg-gray-100 rounded-full items-center justify-center">
                                        <Text className="text-lg">{cat.icon || "🏷️"}</Text>
                                    </View>
                                    <Text className="font-semibold text-gray-900 text-sm">{cat.name}</Text>
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
                    onFamilyUpdated={fetchData} // Refresh data on update
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
                title="Delete Plan?"
                message={`Are you sure you want to delete "${formName}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
                isLoading={isSaving}
            />

        </View>
    );
}

