import { View, Text, Modal, Pressable, ActivityIndicator } from "react-native";
import { cn } from "../../lib/utils";

interface ConfirmDialogConfig {
    visible: boolean;
    title: string;
    message: string;
    actionLabel: string;
    isDestructive?: boolean;
    isLoading?: boolean;
    onConfirm: () => Promise<void> | void;
    onCancel: () => void;
}

interface ConfirmDialogProps extends ConfirmDialogConfig {}

export function ConfirmDialog({ 
    visible, 
    title, 
    message, 
    actionLabel, 
    isDestructive = false, 
    isLoading = false,
    onConfirm, 
    onCancel 
}: ConfirmDialogProps) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View className="flex-1 bg-black/50 items-center justify-center p-6">
                <View className="bg-white p-6 rounded-3xl w-full shadow-xl max-w-sm">
                    <Text className="text-lg font-bold text-gray-900 mb-2">{title}</Text>
                    <Text className="text-gray-500 mb-6">{message}</Text>
                    <View className="flex-row gap-3">
                        <Pressable 
                            className="flex-1 bg-gray-100 p-3 rounded-xl items-center"
                            onPress={onCancel}
                            disabled={isLoading}
                        >
                            <Text className="font-bold text-gray-700">Cancel</Text>
                        </Pressable>
                        <Pressable 
                            className={cn(
                                "flex-1 p-3 rounded-xl items-center", 
                                isDestructive ? "bg-red-600" : "bg-blue-600",
                                isLoading && "opacity-70"
                            )}
                            onPress={onConfirm}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <Text className="font-bold text-white">{actionLabel}</Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

// Hook-like helper for managing confirm dialog state
export interface ConfirmDialogState {
    visible: boolean;
    title: string;
    message: string;
    actionLabel: string;
    isDestructive?: boolean;
    onConfirm: () => Promise<void> | void;
}

export const createConfirmDialogState = (): ConfirmDialogState => ({
    visible: false,
    title: "",
    message: "",
    actionLabel: "",
    isDestructive: false,
    onConfirm: () => {},
});
