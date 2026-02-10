import { View, Text, Modal, Pressable, ScrollView, TextInput, ActivityIndicator, Switch, Share, Linking, Alert } from "react-native";
import { useState, useEffect } from "react";
import { X, UserPlus, Users, Check, Share2, Copy, Mail, MessageCircle } from "lucide-react-native";
import { API_URL, WEB_URL } from "../../constants/config";
import { cn } from "../../lib/utils";
import { Image } from "expo-image";
import { getAuthHeader } from "../../lib/auth";
import { useFamily } from "../../context/family-context";

interface FamilyMember {
    id: string;
    name: string;
    email: string;
    role: "owner" | "admin" | "member";
    avatar_url?: string;
    status: "active" | "pending";
}

interface Invitation {
    id: string;
    family_id: string;
    family_name: string;
    inviter_name: string;
    created_at: string;
}

interface FamilyGroup {
    id: string;
    name: string;
    members: FamilyMember[];
    owner_id: string;
    is_default?: boolean;
}

interface FamilyModalProps {
    visible: boolean;
    onClose: () => void;
    currentUserId?: string;
    onFamilyUpdated?: () => void;
}

export function FamilyManagementModal({ visible, onClose, currentUserId, onFamilyUpdated }: FamilyModalProps) {
    const { families, activeFamily, switchFamily, refreshFamilies, isLoading: isFamilyLoading } = useFamily();
    const [view, setView] = useState<"list" | "create" | "invite">("list");
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [switching, setSwitching] = useState(false);

    const [newFamilyName, setNewFamilyName] = useState("");
    const [inviteEmail, setInviteEmail] = useState("");

    const [confirmConfig, setConfirmConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        actionLabel: string;
        isDestructive?: boolean;
        onConfirm: () => Promise<void> | void;
    } | null>(null);

    useEffect(() => {
        if (visible) {
            setIsLoading(true);
            refreshFamilies();
            fetchInvitations().finally(() => setIsLoading(false));
        }
    }, [visible]);

    const fetchInvitations = async () => {
        try {
            const headers = await getAuthHeader();
            const invRes = await fetch(`${API_URL}/mobile/invitations`, { headers });
            if (invRes.ok) {
                setInvitations(await invRes.json());
            }
        } catch (e) {
            console.error("Failed to fetch invitations", e);
        }
    };

    const handleCreateFamily = async () => {
        if (!newFamilyName.trim()) return;
        setSwitching(true);
        try {
            const headers = await getAuthHeader();
            const res = await fetch(`${API_URL}/mobile/families`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newFamilyName })
            });

            if (res.ok) {
                await refreshFamilies();
                setView("list");
                setNewFamilyName("");
                if (onFamilyUpdated) onFamilyUpdated();
            } else {
                alert("Failed to create family");
            }
        } catch (e) {
            alert("Error creating family");
        } finally {
            setSwitching(false);
        }
    };

    const handleSwitchFamily = async (familyId: string) => {
        setSwitching(true);
        try {
            await switchFamily(familyId);
            if (onFamilyUpdated) onFamilyUpdated();
        } catch (e) {
            console.error("Failed to switch family", e);
        } finally {
            setSwitching(false);
        }
    };

    const executeDeleteFamily = async () => {
        if (!activeFamily?.id) return;
        setSwitching(true);
        try {
            const headers = await getAuthHeader();
            const res = await fetch(`${API_URL}/mobile/families/${activeFamily.id}`, {
                method: 'DELETE',
                headers
            });
            if (res.ok) {
                await refreshFamilies();
                if (onFamilyUpdated) onFamilyUpdated();
            } else {
                const d = await res.json();
                alert(d.error || "Failed to delete family");
            }
        } catch (e) {
            alert("Error deleting family");
        } finally {
            setSwitching(false);
        }
    };

    const requestDeleteFamily = () => {
        setConfirmConfig({
            visible: true,
            title: "Delete Family?",
            message: "Are you sure you want to delete this family? This action cannot be undone if no transactions exist.",
            actionLabel: "Delete",
            isDestructive: true,
            onConfirm: executeDeleteFamily
        });
    };

    const executeRemoveMember = async (userId: string) => {
        if (!activeFamily?.id) return;
        setSwitching(true);
        try {
            const headers = await getAuthHeader();
            const res = await fetch(`${API_URL}/mobile/families/members`, {
                method: 'DELETE',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: userId, familyId: activeFamily.id })
            });
            if (res.ok) {
                await refreshFamilies();
            } else {
                alert("Failed to remove member");
            }
        } catch (e) {
            alert("Error removing member");
        } finally {
            setSwitching(false);
        }
    };

    const requestRemoveMember = (userId: string) => {
        setConfirmConfig({
            visible: true,
            title: "Remove Member?",
            message: "Are you sure you want to remove this member from the family?",
            actionLabel: "Remove",
            isDestructive: true,
            onConfirm: () => executeRemoveMember(userId)
        });
    };

    const executeUpdateRole = async (userId: string, role: 'admin' | 'member') => {
        if (!activeFamily?.id) return;
        setSwitching(true);
        try {
            const headers = await getAuthHeader();
            const res = await fetch(`${API_URL}/mobile/families/members`, {
                method: 'PUT',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: userId, familyId: activeFamily.id, role })
            });
            if (res.ok) {
                await refreshFamilies();
            } else {
                alert("Failed to update role");
            }
        } catch (e) {
            alert("Error updating role");
        } finally {
            setSwitching(false);
        }
    };

    const createInvitation = async (email?: string): Promise<string | null> => {
        if (!activeFamily?.id) return null;
        try {
            const headers = await getAuthHeader();
            const res = await fetch(`${API_URL}/mobile/invitations`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email || null, familyId: activeFamily.id })
            });
            const data = await res.json();
            if (res.ok) {
                return data.token;
            } else {
                alert(data.error || "Failed to create invitation");
                return null;
            }
        } catch (e) {
            alert("Error creating invitation");
            return null;
        }
    };

    const handleSendInvite = async () => {
        if (!inviteEmail.trim()) return;
        setSwitching(true);
        const token = await createInvitation(inviteEmail);
        setSwitching(false);
        if (token) {
            alert("Invitation sent successfully!");
            setView("list");
            setInviteEmail("");
        }
    };

    const handleShareAction = async (type: 'whatsapp' | 'copy' | 'share') => {
        setSwitching(true);
        const token = await createInvitation();
        setSwitching(false);

        if (!token) return;

        const link = `${WEB_URL}/join/${token}`;

        if (type === 'whatsapp') {
            Linking.openURL(`whatsapp://send?text=Join my family on Morfosis: ${link}`);
        } else if (type === 'copy') {
            try {
                const Clipboard = require('expo-clipboard');
                await Clipboard.setStringAsync(link);
                alert("Link copied to clipboard!");
            } catch (e) {
                alert("Clipboard feature requires app rebuild. Please rebuild your dev client.");
            }
        } else if (type === 'share') {
            Share.share({
                message: `Join my family on Morfosis! ${link}`,
                url: link,
                title: 'Join Family'
            });
        }
    };

    const handleRespondInvitation = async (invitationId: string, action: 'accept' | 'decline') => {
        setSwitching(true);
        try {
            const headers = await getAuthHeader();
            const res = await fetch(`${API_URL}/mobile/invitations/respond`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ invitationId, action })
            });
            if (res.ok) {
                await refreshFamilies();
                await fetchInvitations();
                if (onFamilyUpdated) onFamilyUpdated();
            } else {
                alert("Failed to respond to invitation");
            }
        } catch (e) {
            alert("Error responding to invitation");
        } finally {
            setSwitching(false);
        }
    };

    const requestUpdateRole = (userId: string, role: 'admin' | 'member') => {
        setConfirmConfig({
            visible: true,
            title: role === 'admin' ? "Make Admin?" : "Revoke Admin?",
            message: role === 'admin'
                ? "This user will have full access to manage family settings and members."
                : "This user will no longer be able to manage family settings.",
            actionLabel: role === 'admin' ? "Confirm" : "Revoke",
            isDestructive: false,
            onConfirm: () => executeUpdateRole(userId, role)
        });
    };

    // Loading Skeleton
    const renderSkeleton = () => (
        <View>
            <View className="h-7 w-48 bg-gray-200 rounded-lg mb-6" />

            <View className="h-4 w-24 bg-gray-200 rounded mb-3" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
                {[1, 2].map(i => (
                    <View key={i} className="w-[140px] h-[130px] bg-gray-100 rounded-[20px] items-center justify-center gap-3">
                        <View className="h-12 w-12 bg-gray-200 rounded-full" />
                        <View className="h-4 w-20 bg-gray-200 rounded" />
                    </View>
                ))}
                <View className="w-[140px] h-[130px] border border-dashed border-gray-200 rounded-[20px] items-center justify-center gap-2">
                    <View className="h-10 w-10 bg-gray-100 rounded-full" />
                    <View className="h-3 w-16 bg-gray-100 rounded" />
                </View>
            </ScrollView>

            <View className="h-4 w-20 bg-gray-200 rounded mb-4" />
            <View className="bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden">
                {[1, 2].map(i => (
                    <View key={i} className={cn("p-4 flex-row items-center gap-3", i !== 1 && "border-t border-gray-100")}>
                        <View className="h-10 w-10 bg-gray-200 rounded-full" />
                        <View className="flex-1">
                            <View className="h-4 w-28 bg-gray-200 rounded mb-1" />
                            <View className="h-3 w-20 bg-gray-100 rounded" />
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );

    const renderListView = () => (
        <View>
            <Text className="text-xl font-bold text-gray-900 mb-6">Family Management</Text>

            <Text className="text-xs font-bold text-gray-500 uppercase mb-3 ml-1">Active Family</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
                {families.map(fam => (
                    <Pressable
                        key={fam.id}
                        onPress={() => handleSwitchFamily(fam.id)}

                    >
                        <View style={[
                            { width: 140, height: 130, padding: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
                            activeFamily?.id === fam.id ? { backgroundColor: '#eff6ff', borderColor: '#3b82f6' } : { backgroundColor: '#ffffff', borderColor: '#f3f4f6' }
                        ]}>
                            <View className={cn("h-12 w-12 rounded-full items-center justify-center", activeFamily?.id === fam.id ? "bg-blue-100" : "bg-gray-100")}>
                                <Users size={24} color={activeFamily?.id === fam.id ? "#2563eb" : "#64748b"} />
                            </View>
                            <Text
                                className={cn("font-bold text-sm text-center", activeFamily?.id === fam.id ? "text-blue-700" : "text-gray-700")}
                                numberOfLines={2}
                            >
                                {fam.name}
                            </Text>
                            {activeFamily?.id === fam.id && (
                                <View className="bg-blue-500 rounded-full p-1 absolute top-3 right-3">
                                    <Check size={10} color="white" strokeWidth={3} />
                                </View>
                            )}
                        </View>
                    </Pressable>
                ))}

                <Pressable
                    onPress={() => setView("create")}

                >
                    <View className="w-[140px] h-[130px] border border-dashed border-gray-300 rounded-[20px] items-center justify-center bg-gray-100 gap-2">
                        <View className="h-10 w-10 rounded-full bg-white border border-gray-200 items-center justify-center">
                            <UserPlus size={20} color="#64748b" />
                        </View>
                        <Text className="font-bold text-sm text-gray-500">New Family</Text>
                    </View>
                </Pressable>
            </ScrollView>

            {invitations.length > 0 && (
                <View className="mb-6">
                    <Text className="text-xs font-bold text-gray-500 uppercase ml-1 mb-3">Pending Invitations</Text>
                    <View className="gap-3">
                        {invitations.map(inv => (
                            <View key={inv.id} className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex-row items-center justify-between">
                                <View className="flex-1">
                                    <Text className="font-bold text-blue-900 text-[15px]">{inv.family_name}</Text>
                                    <Text className="text-xs text-blue-600">Invited by {inv.inviter_name}</Text>
                                </View>
                                <View className="flex-row gap-2">
                                    <Pressable
                                        onPress={() => handleRespondInvitation(inv.id, 'decline')}
                                        className="bg-white p-2 rounded-full border border-blue-100"
                                    >
                                        <X size={16} color="#ef4444" />
                                    </Pressable>
                                    <Pressable
                                        onPress={() => handleRespondInvitation(inv.id, 'accept')}
                                        className="bg-blue-600 p-2 rounded-full shadow-lg shadow-blue-600/20"
                                    >
                                        <Check size={16} color="white" />
                                    </Pressable>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {activeFamily && (
                <View>
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-xs font-bold text-gray-500 uppercase ml-1">Members</Text>
                        <View className="flex-row items-center gap-3">
                            {families.find(f => f.id === activeFamily.id)?.members.find(m => m.id === currentUserId)?.role === 'owner' && (
                                <Pressable onPress={requestDeleteFamily} className="bg-red-50 px-3 py-1.5 rounded-full">
                                    <Text className="text-xs font-bold text-red-600">Delete Family</Text>
                                </Pressable>
                            )}
                            <Pressable onPress={() => setView("invite")}>
                                <Text className="text-blue-600 text-xs font-bold">Invite Member</Text>
                            </Pressable>
                        </View>
                    </View>

                    <View className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                        {families.find(f => f.id === activeFamily.id)?.members.map((member, i) => {
                            const isAdmin = families.find(f => f.id === activeFamily.id)?.members.find(m => m.id === currentUserId)?.role === 'admin' || families.find(f => f.id === activeFamily.id)?.members.find(m => m.id === currentUserId)?.role === 'owner';
                            return (
                                <View key={member.id} className={cn("p-4 flex-row items-center justify-between", i !== 0 && "border-t border-gray-50")}>
                                    <View className="flex-row items-center gap-3 flex-1">
                                        <View className="h-10 w-10 rounded-full bg-indigo-50 items-center justify-center">
                                            <Text className="font-bold text-indigo-600 uppercase">{(member.name || "?").charAt(0)}</Text>
                                        </View>
                                        <View>
                                            <Text className="font-bold text-gray-900 text-[15px]">{member.name} {member.id === currentUserId && "(You)"}</Text>
                                            <Text className="text-xs text-gray-500 capitalize">{member.role} • {member.status}</Text>
                                        </View>
                                    </View>

                                    {
                                        isAdmin && member.id !== currentUserId && member.role !== 'owner' && (
                                            <View className="flex-row items-center gap-2">
                                                <Pressable
                                                    onPress={() => requestUpdateRole(member.id, member.role === 'admin' ? 'member' : 'admin')}
                                                    className={cn("px-2 py-1 rounded-md", member.role === 'admin' ? "bg-red-50" : "bg-gray-100")}
                                                >
                                                    <Text className={cn("text-[10px] font-bold", member.role === 'admin' ? "text-red-600" : "text-gray-600")}>
                                                        {member.role === 'admin' ? "Revoke Admin" : "Make Admin"}
                                                    </Text>
                                                </Pressable>

                                                <Pressable onPress={() => requestRemoveMember(member.id)} className="bg-red-50 p-2 rounded-full">
                                                    <X size={14} color="#dc2626" />
                                                </Pressable>
                                            </View>
                                        )
                                    }
                                </View>
                            );
                        })}
                    </View>
                </View>
            )
            }
        </View >
    );

    const renderCreateView = () => (
        <View>
            <View className="flex-row items-center mb-6">
                <Pressable onPress={() => setView("list")} className="mr-3 bg-gray-100 p-2 rounded-full">
                    <X size={16} color="black" />
                </Pressable>
                <Text className="text-xl font-bold text-gray-900">Create New Family</Text>
            </View>

            <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 mb-2">Family Name</Text>
                <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900"
                    placeholder="e.g. The Smiths"
                    placeholderTextColor="#9ca3af"
                    value={newFamilyName}
                    onChangeText={setNewFamilyName}
                    autoFocus
                />
            </View>

            <Pressable
                className="w-full bg-gray-900 h-14 rounded-2xl items-center justify-center shadow-lg active:scale-[0.98]"
                onPress={handleCreateFamily}
            >
                {switching ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-[16px]">Create Family</Text>}
            </Pressable>
        </View>
    );

    const renderInviteView = () => (
        <View>
            <View className="flex-row items-center mb-6">
                <Pressable onPress={() => setView("list")} className="mr-3 bg-gray-100 p-2 rounded-full">
                    <X size={16} color="black" />
                </Pressable>
                <Text className="text-xl font-bold text-gray-900">Invite Members</Text>
            </View>

            <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 mb-2">Email Address</Text>
                <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900"
                    placeholder="Enter email..."
                    placeholderTextColor="#9ca3af"
                    value={inviteEmail}
                    onChangeText={setInviteEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
            </View>

            <View className="flex-row gap-3 mb-8">
                <Pressable
                    onPress={() => handleShareAction('whatsapp')}
                    className="flex-1 bg-green-50 border border-green-100 p-4 rounded-2xl items-center gap-2"
                >
                    <MessageCircle size={24} color="#16a34a" />
                    <Text className="text-xs font-bold text-green-700">WhatsApp</Text>
                </Pressable>
                <Pressable
                    onPress={() => handleShareAction('copy')}
                    className="flex-1 bg-blue-50 border border-blue-100 p-4 rounded-2xl items-center gap-2"
                >
                    <Copy size={24} color="#2563eb" />
                    <Text className="text-xs font-bold text-blue-700">Copy Link</Text>
                </Pressable>
                <Pressable
                    onPress={() => handleShareAction('share')}
                    className="flex-1 bg-indigo-50 border border-indigo-100 p-4 rounded-2xl items-center gap-2"
                >
                    <Share2 size={24} color="#4f46e5" />
                    <Text className="text-xs font-bold text-indigo-700">Share</Text>
                </Pressable>
            </View>

            <Pressable
                className="w-full bg-gray-900 h-14 rounded-2xl items-center justify-center shadow-lg active:scale-[0.98]"
                onPress={handleSendInvite}
            >
                {switching ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-[16px]">Send Invite</Text>}
            </Pressable>
        </View>
    );

    return (
        <>
            <Modal visible={visible} animationType="slide" transparent>
                <View className="flex-1 justify-end bg-black/40">
                    <Pressable className="flex-1" onPress={onClose} />
                    <View className="bg-white rounded-t-[32px] p-6 pb-10 min-h-[60%]">
                        {/* iOS-style handle */}
                        <View className="w-10 h-1 bg-gray-300 rounded-full self-center mb-6" />

                        {(isLoading || isFamilyLoading) && !families.length ? renderSkeleton() : (
                            <>
                                {view === 'list' && renderListView()}
                                {view === 'create' && renderCreateView()}
                                {view === 'invite' && renderInviteView()}
                            </>
                        )}

                        {/* Loading Overlay */}
                        {switching && (
                            <View className="absolute inset-0 bg-white/80 items-center justify-center z-50 rounded-t-[32px]">
                                <View className="bg-white p-6 rounded-2xl shadow-lg items-center">
                                    <ActivityIndicator size="large" color="#2563eb" />
                                    <Text className="text-sm font-medium text-gray-600 mt-3">Please wait...</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Confirmation Modal */}
            {confirmConfig && (
                <Modal visible={!!confirmConfig} transparent animationType="fade">
                    <View className="flex-1 bg-black/50 items-center justify-center p-6">
                        <View className="bg-white p-6 rounded-3xl w-full shadow-xl">
                            <Text className="text-lg font-bold text-gray-900 mb-2">{confirmConfig.title}</Text>
                            <Text className="text-gray-500 mb-6">{confirmConfig.message}</Text>
                            <View className="flex-row gap-3">
                                <Pressable
                                    className="flex-1 bg-gray-100 p-3 rounded-xl items-center"
                                    onPress={() => setConfirmConfig(null)}
                                >
                                    <Text className="font-bold text-gray-700">Cancel</Text>
                                </Pressable>
                                <Pressable
                                    className={cn("flex-1 p-3 rounded-xl items-center", confirmConfig.isDestructive ? "bg-red-600" : "bg-blue-600")}
                                    onPress={() => {
                                        confirmConfig.onConfirm();
                                        setConfirmConfig(null);
                                    }}
                                >
                                    <Text className="font-bold text-white">{confirmConfig.actionLabel}</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
        </>
    );
}
