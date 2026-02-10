import { View, Text, Modal, Pressable, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useState, useEffect, useCallback } from "react";
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { X, Plus, GripVertical, Trash2, Pencil, Check } from "lucide-react-native";
import { API_URL } from "../../constants/config";
import { getAuthHeader } from "../../lib/auth";
import { cn } from "../../lib/utils";
import { useFamily } from "../../context/family-context";

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
    const [selectedFamilyId, setSelectedFamilyId] = useState<string>("");
    const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [showForm, setShowForm] = useState(false);
    const [editCategory, setEditCategory] = useState<Category | null>(null);
    const [catName, setCatName] = useState("");

    const fetchCategories = useCallback(async () => {
        setIsLoading(true);
        try {
            const headers = await getAuthHeader();
            const res = await fetch(`${API_URL}/mobile/categories`, { headers });
            if (res.ok) {
                const data = await res.json();
                // Filter only custom categories for management (family_id != null)
                // And filter by type
                const filtered = data
                    .filter((c: Category) =>
                        (c.type === activeTab || c.type === 'both') &&
                        !!c.family_id &&
                        (!selectedFamilyId || c.family_id === selectedFamilyId)
                    )
                    .sort((a: Category, b: Category) => a.sort_order - b.sort_order);
                setCategories(filtered);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        if (visible) {
            if (activeFamily && !selectedFamilyId) {
                setSelectedFamilyId(activeFamily.id);
            }
            fetchCategories();
        }
    }, [visible, fetchCategories, activeFamily]);

    // Re-fetch or re-filter when selected family changes
    useEffect(() => {
        if (visible) fetchCategories();
    }, [selectedFamilyId]);

    const handleSave = async () => {
        if (!catName.trim()) return;
        setIsSaving(true);
        try {
            const headers = await getAuthHeader();
            if (editCategory) {
                // Update
                const res = await fetch(`${API_URL}/mobile/categories/${editCategory.id}`, {
                    method: 'PUT',
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: catName, type: activeTab })
                });
                if (!res.ok) throw new Error("Failed to update");
            } else {
                // Create
                if (!selectedFamilyId) return; // Should not happen if UI is correct
                const res = await fetch(`${API_URL}/mobile/categories`, {
                    method: 'POST',
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: catName,
                        type: activeTab,
                        family_id: selectedFamilyId
                    })
                });
                if (!res.ok) throw new Error("Failed to create");
            }
            setShowForm(false);
            setCatName("");
            setEditCategory(null);
            fetchCategories();
        } catch (e) {
            Alert.alert("Error", "Failed to save category");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        Alert.alert("Delete Category", "Are you sure? This action cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        const headers = await getAuthHeader();
                        await fetch(`${API_URL}/mobile/categories/${id}`, {
                            method: 'DELETE',
                            headers
                        });
                        fetchCategories();
                    } catch (e) {
                        Alert.alert("Error", "Failed to delete");
                    }
                }
            }
        ]);
    };

    const handleDragEnd = async ({ data }: { data: Category[] }) => {
        setCategories(data); // Optimistic update
        try {
            const headers = await getAuthHeader();
            // Assuming backend accepts a list of {id, sort_order} or similar
            // If backend mirrors web, it might take a list of updates
            const updates = data.map((c, index) => ({ id: c.id, sort_order: index }));

            await fetch(`${API_URL}/mobile/categories/reorder`, {
                method: 'PATCH', // Or PUT, matching web action
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates })
            });
        } catch (e) {
            console.error("Reorder failed", e);
            fetchCategories(); // Revert
        }
    };

    const openCreate = () => {
        setEditCategory(null);
        setCatName("");
        setShowForm(true);
    };

    const openEdit = (cat: Category) => {
        setEditCategory(cat);
        setCatName(cat.name);
        setShowForm(true);
    };

    const renderItem = ({ item, drag, isActive }: RenderItemParams<Category>) => {
        return (
            <ScaleDecorator>
                <Pressable
                    onLongPress={drag}
                    disabled={isActive}
                    className={cn(
                        "bg-white flex-row items-center p-4 mb-2 rounded-2xl border ",
                        isActive ? "border-blue-500 shadow-lg scale-105 z-10" : "border-gray-100 shadow-sm"
                    )}
                >
                    <Pressable onPressIn={drag} className="p-2 -ml-2 mr-2">
                        <GripVertical size={20} color="#9ca3af" />
                    </Pressable>

                    <View className="flex-1">
                        <Text className="text-gray-900 font-semibold text-[15px]">{item.name}</Text>
                        <Text className="text-gray-400 text-xs mt-0.5 capitalize">{item.type}</Text>
                    </View>

                    <View className="flex-row items-center gap-1">
                        <Pressable onPress={() => openEdit(item)} className="p-2 bg-gray-50 rounded-lg active:bg-gray-100">
                            <Pencil size={18} color="#4b5563" />
                        </Pressable>
                        <Pressable onPress={() => handleDelete(item.id)} className="p-2 bg-red-50 rounded-lg active:bg-red-100">
                            <Trash2 size={18} color="#ef4444" />
                        </Pressable>
                    </View>
                </Pressable>
            </ScaleDecorator>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <GestureHandlerRootView className="flex-1 bg-gray-50">
                <View className={cn("bg-white px-5 pb-4 border-b border-gray-100 flex-row items-center justify-between", Platform.OS === 'android' ? "pt-12" : "pt-4")}>
                    <Text className="text-xl font-bold text-gray-900">Categories</Text>
                    <Pressable onPress={onClose} className="bg-gray-100 p-2 rounded-full">
                        <X size={20} color="#374151" />
                    </Pressable>
                </View>

                {/* Family Selector */}
                <View className="px-4 py-3 bg-white border-b border-gray-50">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                        {families.map(f => (
                            <Pressable
                                key={f.id}
                                onPress={() => setSelectedFamilyId(f.id)}
                                className={cn(
                                    "px-4 py-2 rounded-full border",
                                    selectedFamilyId === f.id
                                        ? "bg-gray-900 border-gray-900"
                                        : "bg-white border-gray-200"
                                )}
                            >
                                <Text className={cn(
                                    "text-xs font-bold",
                                    selectedFamilyId === f.id ? "text-white" : "text-gray-600"
                                )}>
                                    {f.name}
                                </Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>

                {/* Tabs */}
                <View className="flex-row p-4 gap-3 bg-white border-b border-gray-50">
                    <Pressable
                        onPress={() => setActiveTab('expense')}
                        className={cn(
                            "flex-1 py-2.5 rounded-xl items-center justify-center border",
                            activeTab === 'expense' ? "bg-gray-900 border-gray-900" : "bg-white border-gray-200"
                        )}
                    >
                        <Text className={cn("font-bold text-sm", activeTab === 'expense' ? "text-white" : "text-gray-600")}>Expense</Text>
                    </Pressable>
                    <Pressable
                        onPress={() => setActiveTab('income')}
                        className={cn(
                            "flex-1 py-2.5 rounded-xl items-center justify-center border",
                            activeTab === 'income' ? "bg-gray-900 border-gray-900" : "bg-white border-gray-200"
                        )}
                    >
                        <Text className={cn("font-bold text-sm", activeTab === 'income' ? "text-white" : "text-gray-600")}>Income</Text>
                    </Pressable>
                </View>

                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#3b82f6" />
                    </View>
                ) : (
                    <DraggableFlatList
                        data={categories}
                        onDragEnd={handleDragEnd}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                        ListEmptyComponent={
                            <View className="items-center justify-center py-12">
                                <Text className="text-gray-400 font-medium">No custom categories found</Text>
                                <Text className="text-gray-400 text-xs mt-1">Tap + to add one</Text>
                            </View>
                        }
                    />
                )}

                {/* FAB */}
                <Pressable
                    onPress={openCreate}
                    className="absolute bottom-10 right-6 h-14 w-14 bg-blue-600 rounded-full items-center justify-center shadow-xl shadow-blue-600/30"
                >
                    <Plus size={28} color="white" />
                </Pressable>

                {/* Edit Form Modal */}
                <Modal visible={showForm} transparent animationType="fade">
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        className="flex-1 justify-end bg-black/50"
                    >
                        <Pressable className="flex-1" onPress={() => setShowForm(false)} />
                        <View className="bg-white rounded-t-[32px] p-6 pb-10">
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-xl font-bold text-gray-900">{editCategory ? "Edit Category" : "New Category"}</Text>
                                <Pressable onPress={() => setShowForm(false)} className="bg-gray-100 p-2 rounded-full">
                                    <X size={20} color="#374151" />
                                </Pressable>
                            </View>

                            <Text className="text-sm font-bold text-gray-700 mb-2">Category Name</Text>
                            <TextInput
                                className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-gray-900 text-base"
                                placeholder="e.g. Groceries"
                                value={catName}
                                onChangeText={setCatName}
                                autoFocus
                            />

                            <Pressable
                                onPress={handleSave}
                                disabled={isSaving || !catName.trim()}
                                className={cn(
                                    "mt-6 h-14 bg-gray-900 rounded-2xl items-center justify-center flex-row gap-2 shadow-lg shadow-gray-900/10",
                                    (isSaving || !catName.trim()) && "opacity-50"
                                )}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <Check size={20} color="white" strokeWidth={2.5} />
                                        <Text className="text-white font-bold text-base">Save Category</Text>
                                    </>
                                )}
                            </Pressable>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>
            </GestureHandlerRootView>
        </Modal>
    );
}
