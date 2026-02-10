import React from 'react';
import { Modal, View, Text, Pressable, Animated } from 'react-native';
import { cn } from '../../lib/utils';
import { AlertTriangle, X } from 'lucide-react-native';
import { Button } from './button';
import { useTheme } from '../../context/theme-context';

interface ConfirmationModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'default';
    isLoading?: boolean;
}

export function ConfirmationModal({
    visible,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'default',
    isLoading = false,
}: ConfirmationModalProps) {
    const { isDark } = useTheme();

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/50 items-center justify-center p-5">
                <View
                    style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff' }}
                    className="w-full max-w-sm rounded-[24px] p-6 shadow-xl items-center"
                >
                    {variant === 'danger' && (
                        <View
                            style={{ backgroundColor: isDark ? '#451a1a' : '#fef2f2' }}
                            className="w-12 h-12 rounded-full items-center justify-center mb-4"
                        >
                            <AlertTriangle size={24} color="#ef4444" />
                        </View>
                    )}

                    <Text
                        style={{ color: isDark ? '#f9fafb' : '#111827' }}
                        className="text-lg font-bold text-center mb-2"
                    >
                        {title}
                    </Text>

                    <Text
                        style={{ color: isDark ? '#9ca3af' : '#6b7280' }}
                        className="text-sm text-center mb-6 leading-relaxed"
                    >
                        {message}
                    </Text>

                    <View className="w-full gap-3">
                        <Button
                            label={confirmText}
                            onPress={onConfirm}
                            variant={variant === 'danger' ? 'danger' : 'primary'}
                            isLoading={isLoading}
                            className="w-full"
                        />
                        <Button
                            label={cancelText}
                            onPress={onClose}
                            variant="ghost"
                            disabled={isLoading}
                            className="w-full"
                            textClassName={isDark ? "text-gray-400" : "text-gray-500"}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
}
