import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { cn } from '../../lib/utils'; // Assuming this exists based on other files
import * as Haptics from 'expo-haptics';

interface ButtonProps {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    disabled?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    className?: string;
    textClassName?: string;
}

export function Button({
    label,
    onPress,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    leftIcon,
    rightIcon,
    className,
    textClassName,
}: ButtonProps) {

    const handlePress = () => {
        if (disabled || isLoading) return;
        if (Platform.OS !== 'web') {
            Haptics.selectionAsync();
        }
        onPress();
    };

    const getVariantStyle = () => {
        switch (variant) {
            case 'primary':
                return 'bg-gray-900 border border-gray-900';
            case 'secondary':
                return 'bg-blue-600 border border-blue-600';
            case 'danger':
                return 'bg-red-500 border border-red-500';
            case 'outline':
                return 'bg-transparent border border-gray-200';
            case 'ghost':
                return 'bg-transparent border-transparent';
            default:
                return 'bg-gray-900 border border-gray-900';
        }
    };

    const getSizeStyle = () => {
        switch (size) {
            case 'sm':
                return 'h-9 px-3';
            case 'md':
                return 'h-12 px-5';
            case 'lg':
                return 'h-14 px-6';
            default:
                return 'h-12 px-5';
        }
    };

    const getTextStyle = () => {
        switch (variant) {
            case 'primary':
            case 'secondary':
            case 'danger':
                return 'text-white';
            case 'outline':
            case 'ghost':
                return 'text-gray-900';
            default:
                return 'text-white';
        }
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            disabled={disabled || isLoading}
            activeOpacity={0.8}
            className={cn(
                'flex-row items-center justify-center rounded-xl',
                getVariantStyle(),
                getSizeStyle(),
                (disabled || isLoading) && 'opacity-60',
                className
            )}
        >
            {isLoading ? (
                <ActivityIndicator
                    color={variant === 'outline' || variant === 'ghost' ? '#111827' : 'white'}
                    size="small"
                />
            ) : (
                <>
                    {leftIcon && <View className="mr-2">{leftIcon}</View>}
                    <Text
                        className={cn(
                            'font-bold text-center',
                            size === 'sm' ? 'text-xs' : 'text-sm',
                            getTextStyle(),
                            textClassName
                        )}
                    >
                        {label}
                    </Text>
                    {rightIcon && <View className="ml-2">{rightIcon}</View>}
                </>
            )}
        </TouchableOpacity>
    );
}

// Helper to avoid issues with Haptics on web or if not installed
import { Platform, View } from 'react-native';
