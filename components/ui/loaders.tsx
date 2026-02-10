import { View, Text, ActivityIndicator, Animated, Image } from "react-native";
import { useRef, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/theme-context";

interface FullScreenLoaderProps {
    isLoading: boolean;
    message?: string;
}

// Full screen overlay loader (for auth transitions)
export function FullScreenLoader({ isLoading, message }: FullScreenLoaderProps) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isLoading) {
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true })
            ]).start();

            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
                ])
            ).start();
        } else {
            Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
            scaleAnim.setValue(0.95);
        }
    }, [isLoading]);

    if (!isLoading && Number(JSON.stringify(fadeAnim)) === 0) return null;

    return (
        <Animated.View
            pointerEvents={isLoading ? "auto" : "none"}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 999,
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: fadeAnim
            }}
        >
            <Animated.View
                style={{
                    backgroundColor: 'white',
                    paddingVertical: 40,
                    paddingHorizontal: 40,
                    borderRadius: 32,
                    alignItems: 'center',
                    shadowColor: '#2563eb',
                    shadowOffset: { width: 0, height: 20 },
                    shadowOpacity: 0.15,
                    shadowRadius: 40,
                    elevation: 10,
                    minWidth: 200,
                    transform: [{ scale: scaleAnim }]
                }}
            >
                <Animated.View style={{ transform: [{ scale: pulseAnim }], marginBottom: 24 }}>
                    <View style={{
                        width: 80,
                        height: 80,
                        backgroundColor: '#eff6ff',
                        borderRadius: 24,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: '#dbeafe'
                    }}>
                        <Image
                            source={require("../../assets/morfosis.webp")}
                            style={{ width: 56, height: 56, resizeMode: 'contain' }}
                        />
                    </View>
                </Animated.View>

                <View style={{ height: 20, marginBottom: 16 }}>
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>

                {message && (
                    <Text style={{
                        marginTop: 8,
                        fontSize: 15,
                        fontWeight: '600',
                        color: '#1e293b',
                        textAlign: 'center',
                        letterSpacing: 0.3
                    }}>
                        {message}
                    </Text>
                )}
            </Animated.View>
        </Animated.View>
    );
}

// Inline loader for content areas
export function InlineLoader({ message = "Loading..." }: { message?: string }) {
    const { isDark } = useTheme();
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
            <View style={{
                width: 64,
                height: 64,
                backgroundColor: isDark ? '#1f2937' : '#f8fafc',
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16
            }}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
            <Text style={{ fontSize: 14, color: isDark ? '#9ca3af' : '#94a3b8', fontWeight: '500' }}>{message}</Text>
        </View>
    );
}

// Theme-aware screen loader used across all dashboard screens
export function ScreenLoader({ message = "Loading..." }: { message?: string }) {
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();

    const headerBg = isDark ? '#111827' : '#1e40af';
    const skeletonBg = isDark ? '#374151' : 'rgba(255,255,255,0.2)';
    const pillBg = isDark ? '#1f2937' : 'rgba(255,255,255,0.15)';
    const contentBg = isDark ? '#1f2937' : '#f8fafc';
    const loaderBoxBg = isDark ? '#374151' : '#ffffff';
    const textColor = isDark ? '#9ca3af' : '#64748b';

    return (
        <View style={{ flex: 1, backgroundColor: headerBg }}>
            {/* Placeholder header skeleton */}
            <View style={{ paddingTop: insets.top, paddingHorizontal: 24, paddingBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ height: 44, width: 44, backgroundColor: skeletonBg, borderRadius: 22 }} />
                        <View>
                            <View style={{ height: 10, width: 60, backgroundColor: skeletonBg, borderRadius: 5, marginBottom: 6 }} />
                            <View style={{ height: 16, width: 80, backgroundColor: skeletonBg, borderRadius: 8 }} />
                        </View>
                    </View>
                    <View style={{ height: 32, width: 100, backgroundColor: pillBg, borderRadius: 16 }} />
                </View>
            </View>

            {/* Loading content area with rounded top */}
            <View style={{
                flex: 1,
                backgroundColor: contentBg,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <View style={{ alignItems: 'center' }}>
                    <View style={{
                        height: 64,
                        width: 64,
                        backgroundColor: loaderBoxBg,
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 16,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: isDark ? 0 : 0.06,
                        shadowRadius: 8,
                        elevation: isDark ? 0 : 3,
                    }}>
                        <ActivityIndicator size="large" color="#3b82f6" />
                    </View>
                    <Text style={{ fontSize: 14, color: textColor, fontWeight: '500' }}>{message}</Text>
                </View>
            </View>
        </View>
    );
}

import { DimensionValue } from "react-native";

// Skeleton loader components for shimmer effects
export function SkeletonBox({ width, height, rounded = 8 }: { width: DimensionValue; height: number; rounded?: number }) {
    return (
        <View style={{
            width,
            height,
            backgroundColor: '#e2e8f0',
            borderRadius: rounded
        }} />
    );
}

export function DarkSkeletonBox({ width, height, rounded = 8 }: { width: DimensionValue; height: number; rounded?: number }) {
    return (
        <View style={{
            width,
            height,
            backgroundColor: '#374151',
            borderRadius: rounded
        }} />
    );
}
