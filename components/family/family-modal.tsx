import { View, Text, Modal, Pressable, ScrollView, TextInput, ActivityIndicator, Switch, Share, Linking, TouchableOpacity } from "react-native";
import { useState, useEffect } from "react";
import { X, UserPlus, Users, Check, Share2, Copy, Mail, MessageCircle } from "lucide-react-native";
import { API_URL, WEB_URL } from "../../constants/config";
import { cn } from "../../lib/utils";
import { Image } from "expo-image";
import { getAuthHeader } from "../../lib/auth";
import { useFamily } from "../../context/family-context";
import { useTheme } from "../../context/theme-context";
import { useLanguage } from "../../context/language-context";
import { useToast } from "../ui/toast";
import { ConfirmationModal } from "../ui/confirmation-modal";

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
    const { isDark } = useTheme();
    const { t } = useLanguage();
    const [view, setView] = useState<"list" | "create" | "invite">("list");
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [switching, setSwitching] = useState(false);
    const { show } = useToast();
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [isRemoveMemberModalVisible, setIsRemoveMemberModalVisible] = useState(false);
    const [isUpdateRoleModalVisible, setIsUpdateRoleModalVisible] = useState(false);
    const [targetMemberId, setTargetMemberId] = useState<string | null>(null);
    const [targetRole, setTargetRole] = useState<'admin' | 'member' | null>(null);

    const [newFamilyName, setNewFamilyName] = useState("");
    const [inviteEmail, setInviteEmail] = useState("");



    // Theme colors
    const sheetBg = isDark ? '#1f2937' : '#ffffff';
    const cardBg = isDark ? '#374151' : '#ffffff';
    const cardBorder = isDark ? '#4b5563' : '#f3f4f6';
    const titleColor = isDark ? '#f9fafb' : '#111827';
    const labelColor = isDark ? '#9ca3af' : '#6b7280';
    const textColor = isDark ? '#d1d5db' : '#374151';
    const inputBg = isDark ? '#374151' : '#f9fafb';
    const inputBorder = isDark ? '#4b5563' : '#e5e7eb';
    const handleColor = isDark ? '#4b5563' : '#d1d5db';
    const skeletonBg = isDark ? '#374151' : '#e5e7eb';
    const skeletonLight = isDark ? '#4b5563' : '#f3f4f6';

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
                show(t('family.failedCreate'), 'error');
            }
        } catch (e) {
            show(t('family.failedCreate'), 'error');
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
                show(d.error || t('family.failedDelete'), 'error');
            }
        } catch (e) {
            show(t('family.failedDelete'), 'error');
        } finally {
            setSwitching(false);
            setIsDeleteModalVisible(false);
        }
    };

    const requestDeleteFamily = () => {
        setIsDeleteModalVisible(true);
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
                show(t('family.memberRemoved') || 'Member removed', 'success');
            } else {
                show(t('family.failedRemove'), 'error');
            }
        } catch (e) {
            show(t('family.failedRemove'), 'error');
        } finally {
            setSwitching(false);
            setIsRemoveMemberModalVisible(false);
            setTargetMemberId(null);
        }
    };

    const requestRemoveMember = (userId: string) => {
        setTargetMemberId(userId);
        setIsRemoveMemberModalVisible(true);
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
                show(t('family.roleUpdated') || 'Role updated', 'success');
            } else {
                show(t('family.failedUpdateRole'), 'error');
            }
        } catch (e) {
            show(t('family.failedUpdateRole'), 'error');
        } finally {
            setSwitching(false);
            setIsUpdateRoleModalVisible(false);
            setTargetMemberId(null);
            setTargetRole(null);
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
                show(data.error || t('family.failedInvite'), 'error');
                return null;
            }
        } catch (e) {
            show(t('family.failedInvite'), 'error');
            return null;
        }
    };

    const handleSendInvite = async () => {
        if (!inviteEmail.trim()) return;
        setSwitching(true);
        const token = await createInvitation(inviteEmail);
        setSwitching(false);
        if (token) {
            show(t('family.inviteSent'), 'success');
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
                show(t('family.linkCopied'), 'success');
            } catch (e) {
                show("Clipboard feature requires app rebuild. Please rebuild your dev client.", 'error');
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
                show(t('family.failedRespond'), 'error');
            }
        } catch (e) {
            show(t('family.failedRespond'), 'error');
        } finally {
            setSwitching(false);
        }
    };

    const requestUpdateRole = (userId: string, role: 'admin' | 'member') => {
        setTargetMemberId(userId);
        setTargetRole(role);
        setIsUpdateRoleModalVisible(true);
    };

    // Loading Skeleton
    const renderSkeleton = () => (
        <View>
            <View style={{ backgroundColor: skeletonBg }} className="h-7 w-48 rounded-lg mb-6" />

            <View style={{ backgroundColor: skeletonBg }} className="h-4 w-24 rounded mb-3" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
                {[1, 2].map(i => (
                    <View key={i} style={{ backgroundColor: skeletonLight }} className="w-[140px] h-[130px] rounded-[20px] items-center justify-center gap-3">
                        <View style={{ backgroundColor: skeletonBg }} className="h-12 w-12 rounded-full" />
                        <View style={{ backgroundColor: skeletonBg }} className="h-4 w-20 rounded" />
                    </View>
                ))}
                <View style={{ borderColor: isDark ? '#4b5563' : '#e5e7eb' }} className="w-[140px] h-[130px] border border-dashed rounded-[20px] items-center justify-center gap-2">
                    <View style={{ backgroundColor: skeletonLight }} className="h-10 w-10 rounded-full" />
                    <View style={{ backgroundColor: skeletonLight }} className="h-3 w-16 rounded" />
                </View>
            </ScrollView>

            <View style={{ backgroundColor: skeletonBg }} className="h-4 w-20 rounded mb-4" />
            <View style={{ backgroundColor: skeletonLight, borderColor: cardBorder }} className="border rounded-2xl overflow-hidden">
                {[1, 2].map(i => (
                    <View key={i} style={i !== 1 ? { borderTopWidth: 1, borderTopColor: cardBorder } : {}} className="p-4 flex-row items-center gap-3">
                        <View style={{ backgroundColor: skeletonBg }} className="h-10 w-10 rounded-full" />
                        <View className="flex-1">
                            <View style={{ backgroundColor: skeletonBg }} className="h-4 w-28 rounded mb-1" />
                            <View style={{ backgroundColor: skeletonLight }} className="h-3 w-20 rounded" />
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );

    const renderListView = () => {
        const currentMember = families.find(f => f.id === activeFamily?.id)?.members.find(m => m.id === currentUserId);
        const isAdmin = currentMember?.role === 'owner' || currentMember?.role === 'admin';
        const isOwner = currentMember?.role === 'owner';

        return (
            <View>
                <Text style={{ color: titleColor }} className="text-xl font-bold mb-6">{t('family.title')}</Text>

                <Text style={{ color: labelColor }} className="text-xs font-bold uppercase mb-3 ml-1">{t('family.activeFamily')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
                    {families.map(fam => (
                        <Pressable
                            key={fam.id}
                            onPress={() => handleSwitchFamily(fam.id)}
                        >
                            <View style={[
                                { width: 140, height: 130, padding: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
                                activeFamily?.id === fam.id
                                    ? { backgroundColor: isDark ? '#1e3a5f' : '#eff6ff', borderColor: '#3b82f6' }
                                    : { backgroundColor: isDark ? '#374151' : '#ffffff', borderColor: isDark ? '#4b5563' : '#f3f4f6' }
                            ]}>
                                <View style={{ backgroundColor: activeFamily?.id === fam.id ? (isDark ? '#1e40af' : '#dbeafe') : (isDark ? '#4b5563' : '#f3f4f6') }} className="h-12 w-12 rounded-full items-center justify-center">
                                    <Users size={24} color={activeFamily?.id === fam.id ? "#60a5fa" : (isDark ? '#9ca3af' : '#64748b')} />
                                </View>
                                <Text
                                    style={{ color: activeFamily?.id === fam.id ? '#60a5fa' : textColor }}
                                    className="font-bold text-sm text-center"
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

                    <Pressable onPress={() => setView("create")}>
                        <View style={{ borderColor: isDark ? '#4b5563' : '#d1d5db', backgroundColor: isDark ? '#374151' : '#f9fafb' }} className="w-[140px] h-[130px] border border-dashed rounded-[20px] items-center justify-center gap-2">
                            <View style={{ backgroundColor: isDark ? '#4b5563' : '#ffffff', borderColor: isDark ? '#6b7280' : '#e5e7eb' }} className="h-10 w-10 rounded-full border items-center justify-center">
                                <UserPlus size={20} color={isDark ? '#9ca3af' : '#64748b'} />
                            </View>
                            <Text style={{ color: labelColor }} className="font-bold text-sm">{t('family.newFamily')}</Text>
                        </View>
                    </Pressable>
                </ScrollView>

                {invitations.length > 0 && (
                    <View className="mb-6">
                        <Text style={{ color: labelColor }} className="text-xs font-bold uppercase ml-1 mb-3">{t('family.pendingInvitations')}</Text>
                        <View className="gap-3">
                            {invitations.map(inv => (
                                <View key={inv.id} style={{ backgroundColor: isDark ? '#1e3a5f' : '#eff6ff', borderColor: isDark ? '#1e40af' : '#bfdbfe' }} className="border p-4 rounded-2xl flex-row items-center justify-between">
                                    <View className="flex-1">
                                        <Text style={{ color: isDark ? '#93c5fd' : '#1e3a8a' }} className="font-bold text-[15px]">{inv.family_name}</Text>
                                        <Text style={{ color: isDark ? '#60a5fa' : '#2563eb' }} className="text-xs">{t('family.invitedBy')} {inv.inviter_name}</Text>
                                    </View>
                                    <View className="flex-row gap-2">
                                        <Pressable
                                            onPress={() => handleRespondInvitation(inv.id, 'decline')}
                                            style={{ backgroundColor: isDark ? '#374151' : '#ffffff', borderColor: isDark ? '#4b5563' : '#bfdbfe' }}
                                            className="p-2 rounded-full border"
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
                            <Text style={{ color: labelColor }} className="text-xs font-bold uppercase ml-1">{t('family.members')}</Text>
                            {isOwner && (
                                <Pressable onPress={requestDeleteFamily} style={{ backgroundColor: isDark ? '#451a1a' : '#fef2f2' }} className="px-3 py-1.5 rounded-full">
                                    <Text className="text-xs font-bold text-red-500">{t('family.deleteFamily')}</Text>
                                </Pressable>
                            )}
                        </View>

                        <View style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-2xl overflow-hidden">
                            {families.find(f => f.id === activeFamily.id)?.members.map((member, i) => {
                                return (
                                    <View key={member.id} style={i !== 0 ? { borderTopWidth: 1, borderTopColor: isDark ? '#374151' : '#f9fafb' } : {}} className="p-4 flex-row items-center justify-between">
                                        <View className="flex-row items-center gap-3 flex-1">
                                            <View style={{ backgroundColor: isDark ? '#312e81' : '#eef2ff' }} className="h-10 w-10 rounded-full items-center justify-center">
                                                <Text style={{ color: isDark ? '#a5b4fc' : '#4f46e5' }} className="font-bold uppercase">{(member.name || "?").charAt(0)}</Text>
                                            </View>
                                            <View>
                                                <Text style={{ color: titleColor }} className="font-bold text-[15px]">{member.name} {member.id === currentUserId && `(${t('family.you')})`}</Text>
                                                <Text style={{ color: labelColor }} className="text-xs capitalize">{member.role} • {member.status}</Text>
                                            </View>
                                        </View>

                                        {
                                            isAdmin && member.id !== currentUserId && member.role !== 'owner' && (
                                                <View className="flex-row items-center gap-2">
                                                    <Pressable
                                                        onPress={() => requestUpdateRole(member.id, member.role === 'admin' ? 'member' : 'admin')}
                                                        style={{ backgroundColor: member.role === 'admin' ? (isDark ? '#451a1a' : '#fef2f2') : (isDark ? '#374151' : '#f3f4f6') }}
                                                        className="px-2 py-1 rounded-md"
                                                    >
                                                        <Text style={{ color: member.role === 'admin' ? '#ef4444' : labelColor }} className="text-[10px] font-bold">
                                                            {member.role === 'admin' ? t('family.revokeAdmin') : t('family.makeAdmin')}
                                                        </Text>
                                                    </Pressable>

                                                    <Pressable onPress={() => requestRemoveMember(member.id)} style={{ backgroundColor: isDark ? '#451a1a' : '#fef2f2' }} className="p-2 rounded-full">
                                                        <X size={14} color="#ef4444" />
                                                    </Pressable>
                                                </View>
                                            )
                                        }
                                    </View>
                                );
                            })}
                        </View>

                        {/* Invite Member - Dashed Button */}
                        {isAdmin && (
                            <TouchableOpacity onPress={() => setView("invite")} className="mt-4 active:opacity-70">
                                <View style={{ borderColor: isDark ? '#4b5563' : '#d1d5db', backgroundColor: isDark ? '#374151' : '#f9fafb' }} className="border border-dashed rounded-2xl py-4 items-center justify-center flex-row gap-2">
                                    <View style={{ backgroundColor: isDark ? '#4b5563' : '#ffffff', borderColor: isDark ? '#6b7280' : '#e5e7eb' }} className="h-8 w-8 rounded-full border items-center justify-center">
                                        <UserPlus size={16} color={isDark ? '#9ca3af' : '#64748b'} />
                                    </View>
                                    <Text style={{ color: labelColor }} className="font-bold text-sm">{t('family.inviteMember')}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View >
        );
    };

    const renderCreateView = () => (
        <View>
            <View className="flex-row items-center mb-6">
                <Pressable onPress={() => setView("list")} style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6' }} className="mr-3 p-2 rounded-full">
                    <X size={16} color={isDark ? '#d1d5db' : '#111827'} />
                </Pressable>
                <Text style={{ color: titleColor }} className="text-xl font-bold">{t('family.createNewFamily')}</Text>
            </View>

            <View className="mb-6">
                <Text style={{ color: textColor }} className="text-sm font-medium mb-2">{t('family.familyName')}</Text>
                <TextInput
                    style={{ backgroundColor: inputBg, borderColor: inputBorder, color: titleColor }}
                    className="border rounded-xl p-4"
                    placeholder={t('family.familyNamePlaceholder')}
                    placeholderTextColor={labelColor}
                    value={newFamilyName}
                    onChangeText={setNewFamilyName}
                    autoFocus
                />
            </View>

            <Pressable
                style={{ backgroundColor: isDark ? '#3b82f6' : '#111827' }}
                className="w-full h-14 rounded-2xl items-center justify-center shadow-lg active:scale-[0.98]"
                onPress={handleCreateFamily}
            >
                {switching ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-[16px]">{t('family.createFamily')}</Text>}
            </Pressable>
        </View>
    );

    const renderInviteView = () => (
        <View>
            <View className="flex-row items-center mb-6">
                <Pressable onPress={() => setView("list")} style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6' }} className="mr-3 p-2 rounded-full">
                    <X size={16} color={isDark ? '#d1d5db' : '#111827'} />
                </Pressable>
                <Text style={{ color: titleColor }} className="text-xl font-bold">{t('family.inviteMembers')}</Text>
            </View>

            <View className="mb-6">
                <Text style={{ color: textColor }} className="text-sm font-medium mb-2">{t('family.emailAddress')}</Text>
                <TextInput
                    style={{ backgroundColor: inputBg, borderColor: inputBorder, color: titleColor }}
                    className="border rounded-xl p-4"
                    placeholder={t('family.emailPlaceholder')}
                    placeholderTextColor={labelColor}
                    value={inviteEmail}
                    onChangeText={setInviteEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
            </View>

            <View className="flex-row gap-3 mb-8">
                <Pressable
                    onPress={() => handleShareAction('whatsapp')}
                    style={{ backgroundColor: isDark ? '#14532d' : '#f0fdf4', borderColor: isDark ? '#166534' : '#bbf7d0' }}
                    className="flex-1 border p-4 rounded-2xl items-center gap-2"
                >
                    <MessageCircle size={24} color="#16a34a" />
                    <Text style={{ color: isDark ? '#4ade80' : '#15803d' }} className="text-xs font-bold">{t('family.whatsapp')}</Text>
                </Pressable>
                <Pressable
                    onPress={() => handleShareAction('copy')}
                    style={{ backgroundColor: isDark ? '#1e3a5f' : '#eff6ff', borderColor: isDark ? '#1e40af' : '#bfdbfe' }}
                    className="flex-1 border p-4 rounded-2xl items-center gap-2"
                >
                    <Copy size={24} color="#2563eb" />
                    <Text style={{ color: isDark ? '#60a5fa' : '#1d4ed8' }} className="text-xs font-bold">{t('family.copyLink')}</Text>
                </Pressable>
                <Pressable
                    onPress={() => handleShareAction('share')}
                    style={{ backgroundColor: isDark ? '#312e81' : '#eef2ff', borderColor: isDark ? '#3730a3' : '#c7d2fe' }}
                    className="flex-1 border p-4 rounded-2xl items-center gap-2"
                >
                    <Share2 size={24} color="#4f46e5" />
                    <Text style={{ color: isDark ? '#a5b4fc' : '#4338ca' }} className="text-xs font-bold">{t('family.share')}</Text>
                </Pressable>
            </View>

            <Pressable
                style={{ backgroundColor: isDark ? '#3b82f6' : '#111827' }}
                className="w-full h-14 rounded-2xl items-center justify-center shadow-lg active:scale-[0.98]"
                onPress={handleSendInvite}
            >
                {switching ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-[16px]">{t('family.sendInvite')}</Text>}
            </Pressable>
        </View>
    );

    return (
        <>
            <Modal visible={visible} animationType="slide" transparent>
                <View className="flex-1 justify-end bg-black/40">
                    <Pressable className="flex-1" onPress={onClose} />
                    <View style={{ backgroundColor: sheetBg }} className="rounded-t-[32px] p-6 pb-10 min-h-[60%]">
                        {/* iOS-style handle */}
                        <View style={{ backgroundColor: handleColor }} className="w-10 h-1 rounded-full self-center mb-6" />

                        {(isLoading || isFamilyLoading) && !families.length ? renderSkeleton() : (
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                                {view === 'list' && renderListView()}
                                {view === 'create' && renderCreateView()}
                                {view === 'invite' && renderInviteView()}
                            </ScrollView>
                        )}

                        {/* Loading Overlay */}
                        {switching && (
                            <View style={{ backgroundColor: isDark ? 'rgba(17,24,39,0.8)' : 'rgba(255,255,255,0.8)' }} className="absolute inset-0 items-center justify-center z-50 rounded-t-[32px]">
                                <View style={{ backgroundColor: sheetBg }} className="p-6 rounded-2xl shadow-lg items-center">
                                    <ActivityIndicator size="large" color="#2563eb" />
                                    <Text style={{ color: labelColor }} className="text-sm font-medium mt-3">{t('family.pleaseWait')}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            <ConfirmationModal
                visible={isDeleteModalVisible}
                onClose={() => setIsDeleteModalVisible(false)}
                onConfirm={executeDeleteFamily}
                title={t('family.deleteFamilyConfirm')}
                message={t('family.deleteFamilyMsg')}
                confirmText={t('common.delete')}
                variant="danger"
                isLoading={switching}
            />

            <ConfirmationModal
                visible={isRemoveMemberModalVisible}
                onClose={() => setIsRemoveMemberModalVisible(false)}
                onConfirm={() => targetMemberId && executeRemoveMember(targetMemberId)}
                title={t('family.removeMemberConfirm')}
                message={t('family.removeMemberMsg')}
                confirmText={t('family.removeMember')}
                variant="danger"
                isLoading={switching}
            />

            <ConfirmationModal
                visible={isUpdateRoleModalVisible}
                onClose={() => setIsUpdateRoleModalVisible(false)}
                onConfirm={() => targetMemberId && targetRole && executeUpdateRole(targetMemberId, targetRole)}
                title={targetRole === 'admin' ? t('family.makeAdminConfirm') : t('family.revokeAdminConfirm')}
                message={targetRole === 'admin' ? t('family.makeAdminMsg') : t('family.revokeAdminMsg')}
                confirmText={targetRole === 'admin' ? t('common.confirm') : t('family.revokeAdmin')}
                isLoading={switching}
            />
        </>
    );
}
