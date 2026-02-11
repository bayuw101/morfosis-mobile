import { View, Text, Modal, Pressable, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import { useState, useEffect, useCallback } from "react";
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { X, Plus, GripVertical, Trash2, Pencil, Check, ChevronRight } from "lucide-react-native";
import { API_URL } from "../../constants/config";
import { getAuthHeader } from "../../lib/auth";
import { cn } from "../../lib/utils";
import { useFamily } from "../../context/family-context";
import { useTheme } from "../../context/theme-context";
import { useLanguage } from "../../context/language-context";
import { Button } from "../ui/button";
import { useToast } from "../ui/toast";
import { ConfirmationModal } from "../ui/confirmation-modal";

interface Category {
    id: string;
    family_id: string;
    name: string;
    type: 'income' | 'expense' | 'both';
    icon?: string;
    sort_order: number;
}

interface CategoryManagementModalProps {
    visible: boolean;
    onClose: () => void;
}

export function CategoryManagementModal({ visible, onClose }: CategoryManagementModalProps) {
    const { families, activeFamily } = useFamily();
    const { isDark } = useTheme();
    const { t } = useLanguage();

    // View State
    const [view, setView] = useState<"list" | "create" | "edit">("list");

    // Data State
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedFamilyId, setSelectedFamilyId] = useState<string>("");
    const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

    // Form State
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formName, setFormName] = useState("");
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const { show } = useToast();

    // Theme colors (matched to Account Modal)
    const sheetBg = isDark ? '#1f2937' : '#ffffff';
    const headerBg = isDark ? '#1f2937' : '#ffffff';
    const headerBorder = isDark ? '#374151' : '#f3f4f6';
    const titleColor = isDark ? '#f9fafb' : '#111827';
    const labelColor = isDark ? '#9ca3af' : '#6b7280';
    const textColor = isDark ? '#d1d5db' : '#374151';
    const cardBg = isDark ? '#374151' : '#ffffff';
    const cardBorder = isDark ? '#4b5563' : '#f3f4f6';
    const inputBg = isDark ? '#374151' : '#f9fafb';
    const inputBorder = isDark ? '#4b5563' : '#e5e7eb';
    const closeBtnBg = isDark ? '#374151' : '#f3f4f6';
    const closeIconColor = isDark ? '#d1d5db' : '#374151';
    const handleColor = isDark ? '#4b5563' : '#d1d5db';
    const skeletonBg = isDark ? '#374151' : '#e5e7eb';
    const skeletonLight = isDark ? '#4b5563' : '#f3f4f6';

    const fetchCategories = useCallback(async () => {
        setIsLoading(true);
        try {
            const headers = await getAuthHeader();
            const res = await fetch(`${API_URL}/mobile/categories?t=${Date.now()}`, { headers });
            if (res.ok) {
                const data = await res.json();
                // Filter only by active tab + family
                const filtered = data
                    .filter((c: Category) =>
                        (c.type === activeTab || c.type === 'both') &&
                        !!c.family_id &&
                        (!selectedFamilyId || c.family_id === selectedFamilyId)
                    )
                    .sort((a: Category, b: Category) => (a.sort_order || 0) - (b.sort_order || 0));
                setCategories(filtered);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, selectedFamilyId]);

    // Initialize
    useEffect(() => {
        if (visible) {
            if (activeFamily && !selectedFamilyId) {
                setSelectedFamilyId(activeFamily.id);
            }
            setView("list");
            fetchCategories();
        }
    }, [visible, activeFamily]);

    // Re-fetch when dependencies change
    useEffect(() => {
        if (visible && selectedFamilyId) fetchCategories();
    }, [selectedFamilyId, activeTab, fetchCategories]);

    const handleNewCategory = () => {
        setEditingCategory(null);
        setFormName("");
        setView("create");
    };

    const handleEditCategory = (cat: Category) => {
        setEditingCategory(cat);
        setFormName(cat.name);
        setView("edit");
    };

    const handleSave = async () => {
        if (!formName.trim()) return;
        setIsSaving(true);
        try {
            const headers = await getAuthHeader();
            const payload = {
                name: formName.trim(),
                type: activeTab, // Defaults to current tab
                family_id: selectedFamilyId
            };

            if (editingCategory) {
                const res = await fetch(`${API_URL}/mobile/categories/${editingCategory.id}`, {
                    method: 'PUT',
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...payload, type: editingCategory.type }) // Keep original type if editing? Or update? Let's use payload type if we want to allow changing type, but UI doesn't support changing type effectively here. For simplicity, just update name.
                    // Actually, let's just send name and type.
                });
                if (!res.ok) throw new Error("Failed to update");
            } else {
                const res = await fetch(`${API_URL}/mobile/categories`, {
                    method: 'POST',
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error("Failed to create");
            }

            setView("list");
            setFormName("");
            setEditingCategory(null);
            fetchCategories();
        } catch (e) {
            show(t('categoryManager.failedSave'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!editingCategory) return;
        setIsSaving(true);
        try {
            const headers = await getAuthHeader();
            await fetch(`${API_URL}/mobile/categories/${editingCategory.id}`, {
                method: 'DELETE',
                headers
            });
            setView("list");
            setEditingCategory(null);
            fetchCategories();
            show(t('categoryManager.deleteSuccess') || 'Category deleted', 'success');
        } catch (e) {
            show(t('categoryManager.failedDelete'), 'error');
        } finally {
            setIsSaving(false);
            setIsDeleteModalVisible(false);
        }
    };

    const handleDelete = () => {
        setIsDeleteModalVisible(true);
    };

    const handleDragEnd = async ({ data }: { data: Category[] }) => {
        setCategories(data);
        try {
            const headers = await getAuthHeader();
            const updates = data.map((c, index) => ({ id: c.id, sort_order: index }));

            await fetch(`${API_URL}/mobile/categories/reorder`, {
                method: 'PATCH',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates })
            });
        } catch (e) {
            console.error("Reorder failed", e);
            fetchCategories();
        }
    };

    const renderSkeleton = () => (
        <View>
            <View style={{ backgroundColor: skeletonBg }} className="h-7 w-48 rounded-lg mb-6" />
            {[1, 2, 3].map(i => (
                <View key={i} style={{ backgroundColor: skeletonLight }} className="rounded-2xl p-4 mb-3 flex-row items-center">
                    <View style={{ backgroundColor: skeletonBg }} className="h-5 w-5 rounded mr-3" />
                    <View style={{ backgroundColor: skeletonBg }} className="h-4 w-32 rounded" />
                </View>
            ))}
        </View>
    );

    const renderListView = () => (
        <View className="flex-1">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-2">
                <Text style={{ color: titleColor }} className="text-xl font-bold">{t('categoryManager.title')}</Text>
                <Pressable
                    onPress={handleNewCategory}
                    style={{ backgroundColor: closeBtnBg }}
                    className="p-2 rounded-full"
                >
                    <Plus size={20} color={closeIconColor} />
                </Pressable>
            </View>

            {/* Family Selector */}
            <View className="mb-4">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {families.map(f => (
                        <Pressable
                            key={f.id}
                            onPress={() => setSelectedFamilyId(f.id)}
                            style={selectedFamilyId === f.id
                                ? { backgroundColor: isDark ? '#3b82f6' : '#111827', borderColor: isDark ? '#3b82f6' : '#111827' }
                                : { backgroundColor: isDark ? '#374151' : '#ffffff', borderColor: isDark ? '#4b5563' : '#e5e7eb' }
                            }
                            className="px-4 py-2 rounded-full border"
                        >
                            <Text
                                style={{ color: selectedFamilyId === f.id ? '#ffffff' : textColor }}
                                className="text-xs font-bold"
                            >
                                {f.name}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>
            </View>

            {/* Tabs */}
            <View style={{ backgroundColor: cardBg, borderColor: inputBorder }} className="flex-row p-1 rounded-xl mb-4 border">
                <Pressable
                    onPress={() => setActiveTab('expense')}
                    style={{ backgroundColor: activeTab === 'expense' ? (isDark ? '#4b5563' : '#ffffff') : 'transparent' }}
                    className={cn("flex-1 py-2 rounded-lg items-center justify-center", activeTab === 'expense' && !isDark && "shadow-sm")}
                >
                    <Text style={{ color: activeTab === 'expense' ? (isDark ? '#ffffff' : '#111827') : labelColor }} className="font-bold text-xs">
                        {t('categoryManager.expense')}
                    </Text>
                </Pressable>
                <Pressable
                    onPress={() => setActiveTab('income')}
                    style={{ backgroundColor: activeTab === 'income' ? (isDark ? '#4b5563' : '#ffffff') : 'transparent' }}
                    className={cn("flex-1 py-2 rounded-lg items-center justify-center", activeTab === 'income' && !isDark && "shadow-sm")}
                >
                    <Text style={{ color: activeTab === 'income' ? (isDark ? '#ffffff' : '#111827') : labelColor }} className="font-bold text-xs">
                        {t('categoryManager.income')}
                    </Text>
                </Pressable>
            </View>

            {/* List */}
            <View className="flex-1">
                {categories.length > 0 ? (
                    <DraggableFlatList
                        data={categories}
                        onDragEnd={handleDragEnd}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        renderItem={({ item, drag, isActive }) => (
                            <TouchableOpacity
                                onLongPress={drag}
                                disabled={isActive}
                                onPress={() => handleEditCategory(item)}
                                activeOpacity={0.7}
                                style={{
                                    backgroundColor: isDark ? '#374151' : '#ffffff',
                                    borderRadius: 16,
                                    borderWidth: 1,
                                    borderColor: isActive ? '#3b82f6' : (isDark ? '#4b5563' : '#f3f4f6'),
                                    padding: 16,
                                    marginBottom: 10,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    elevation: isActive ? 4 : 0,
                                    zIndex: isActive ? 10 : 0,
                                }}
                            >
                                <View className="mr-3">
                                    <GripVertical size={20} color={isDark ? '#6b7280' : '#9ca3af'} />
                                </View>

                                <View className="flex-1">
                                    <Text style={{ color: titleColor }} className="font-bold text-[15px]">{item.name}</Text>
                                    <View className="flex-row items-center mt-1">
                                        <View style={{ backgroundColor: item.type === 'expense' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)' }} className="px-1.5 py-0.5 rounded mr-2">
                                            <Text style={{ color: item.type === 'expense' ? '#ef4444' : '#22c55e' }} className="text-[10px] uppercase font-bold">{item.type}</Text>
                                        </View>
                                    </View>
                                </View>

                                <ChevronRight size={16} color={labelColor} />
                            </TouchableOpacity>
                        )}
                    />
                ) : (
                    <View className="items-center justify-center py-12 px-6">
                        <View style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6' }} className="h-16 w-16 rounded-full items-center justify-center mb-4">
                            <Plus size={24} color={labelColor} />
                        </View>
                        <Text style={{ color: titleColor }} className="font-semibold text-center mb-1">{t('categoryManager.noCustomCategories')}</Text>
                        <Text style={{ color: labelColor }} className="text-sm text-center">{t('categoryManager.tapPlusToAdd')}</Text>
                    </View>
                )}
            </View>
        </View>
    );

    const renderFormView = () => {
        const isEditing = view === "edit";

        return (
            <View>
                {/* Header */}
                <View className="flex-row items-center mb-6">
                    <Pressable onPress={() => { setView("list"); setFormName(""); }} style={{ backgroundColor: closeBtnBg }} className="mr-3 p-2 rounded-full">
                        <X size={16} color={closeIconColor} />
                    </Pressable>
                    <Text style={{ color: titleColor }} className="text-xl font-bold flex-1">
                        {isEditing ? t('categoryManager.editCategory') : t('categoryManager.newCategory')}
                    </Text>
                    {isEditing && (
                        <Pressable onPress={handleDelete} style={{ backgroundColor: isDark ? '#451a1a' : '#fef2f2' }} className="p-2 rounded-full">
                            <Trash2 size={18} color="#ef4444" />
                        </Pressable>
                    )}
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    className="mb-4"
                    keyboardDismissMode="interactive"
                >
                    {/* Name Input */}
                    <View className="mb-5">
                        <Text style={{ color: textColor }} className="text-sm font-bold mb-2">{t('categoryManager.categoryName')}</Text>
                        <TextInput
                            style={{ backgroundColor: inputBg, borderColor: inputBorder, color: titleColor }}
                            className="border rounded-xl p-4"
                            placeholder={t('categoryManager.categoryNamePlaceholder')}
                            placeholderTextColor={labelColor}
                            value={formName}
                            onChangeText={setFormName}
                            autoFocus
                        />
                    </View>

                    {/* Type Info (ReadOnly for now, based on tab) */}
                    <View className="mb-5">
                        <Text style={{ color: textColor }} className="text-sm font-bold mb-2">{t('categoryManager.categoryType')}</Text>
                        <View style={{ backgroundColor: inputBg, borderColor: inputBorder }} className="border rounded-xl p-4 flex-row items-center">
                            <Text style={{ color: titleColor }} className="font-medium capitalize">{activeTab}</Text>
                        </View>
                        <Text style={{ color: labelColor }} className="text-xs mt-2 ml-1">Creating in {activeTab} list.</Text>
                    </View>
                </ScrollView>

                {/* Save Button */}
                <Pressable
                    onPress={handleSave}
                    disabled={isSaving || !formName.trim()}
                    style={{
                        backgroundColor: (isSaving || !formName.trim())
                            ? (isDark ? '#4b5563' : '#d1d5db')
                            : (isDark ? '#3b82f6' : '#111827')
                    }}
                    className="w-full h-14 rounded-2xl items-center justify-center mt-4"
                >
                    {isSaving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-[16px]">
                            {isEditing ? t('categoryManager.saveCategory') : t('categoryManager.createCategory')}
                        </Text>
                    )}
                </Pressable>
            </View>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <GestureHandlerRootView className="flex-1">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1 justify-end bg-black/40"
                >
                    <Pressable className="flex-1" onPress={onClose} />
                    <View style={{ backgroundColor: sheetBg }} className="rounded-t-[32px] p-6 pb-10 h-[80%]">
                        {/* iOS-style handle */}
                        <View style={{ backgroundColor: handleColor }} className="w-10 h-1 rounded-full self-center mb-6" />

                        {isLoading ? renderSkeleton() : (
                            <>
                                {view === 'list' && renderListView()}
                                {(view === 'create' || view === 'edit') && renderFormView()}
                            </>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </GestureHandlerRootView>

            <ConfirmationModal
                visible={isDeleteModalVisible}
                onClose={() => setIsDeleteModalVisible(false)}
                onConfirm={confirmDelete}
                title={t('categoryManager.deleteCategory')}
                message={t('categoryManager.deleteCategoryMsg')}
                confirmText={t('common.delete')}
                cancelText={t('common.cancel')}
                variant="danger"
                isLoading={isSaving}
            />
        </Modal>
    );
}
