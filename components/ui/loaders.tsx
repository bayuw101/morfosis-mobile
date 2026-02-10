import { View, Text, ActivityIndicator, Animated, Image } from "react-native";
import { useRef, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface FullScreenLoaderProps {
    isLoading: boolean;
    message?: string;
}

// Full screen overlay loader (for auth transitions)
// Full screen overlay loader (for auth transitions)
export function FullScreenLoader({ isLoading, message }: FullScreenLoaderProps) {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Scale animation for entrance
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    // Pulse animation for logo
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isLoading) {
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true })
            ]).start();

            // Continuous gentle pulse
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

    if (!isLoading && Number(JSON.stringify(fadeAnim)) === 0) return null; // Simple check, but pointerEvents="none" is better

    return (
        <Animated.View
            pointerEvents={isLoading ? "auto" : "none"}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 999, // Ensure it's on top of everything
                backgroundColor: 'rgba(255, 255, 255, 0.85)', // Slightly more transparent for glass feel
                alignItems: 'center',
                justifyContent: 'center',
                opacity: fadeAnim
            }}
        >
            {/* Blurry Background effect simulation (optional, using just opacity and color here) */}

            <Animated.View
                style={{
                    backgroundColor: 'white',
                    paddingVertical: 40,
                    paddingHorizontal: 40,
                    borderRadius: 32,
                    alignItems: 'center',
                    shadowColor: '#2563eb', // Blue shadow
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
                        backgroundColor: '#eff6ff', // Blue-50
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

                {/* Custom loading dots */}
                <View style={{ height: 20, marginBottom: 16 }}>
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>

                {message && (
                    <Text style={{
                        marginTop: 8,
                        fontSize: 15,
                        fontWeight: '600',
                        color: '#1e293b', // Slate-800
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

// Inline loader for content areas (light theme)
export function InlineLoader({ message = "Loading..." }: { message?: string }) {
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
            <View style={{
                width: 64,
                height: 64,
                backgroundColor: '#f8fafc',
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16
            }}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
            <Text style={{ fontSize: 14, color: '#94a3b8', fontWeight: '500' }}>{message}</Text>
        </View>
    );
}

// Dark themed loader for AppShell screens
export function ScreenLoader({ message = "Loading..." }: { message?: string }) {
    const insets = useSafeAreaInsets();

    return (
        <View style={{ flex: 1, backgroundColor: '#111827' }}>
            {/* Placeholder header skeleton */}
            <View style={{ paddingTop: insets.top, paddingHorizontal: 24, paddingBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ height: 44, width: 44, backgroundColor: '#374151', borderRadius: 22 }} />
                        <View>
                            <View style={{ height: 10, width: 60, backgroundColor: '#374151', borderRadius: 5, marginBottom: 6 }} />
                            <View style={{ height: 16, width: 80, backgroundColor: '#374151', borderRadius: 8 }} />
                        </View>
                    </View>
                    <View style={{ height: 32, width: 100, backgroundColor: '#1f2937', borderRadius: 16 }} />
                </View>
            </View>

            {/* Loading content */}
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ alignItems: 'center' }}>
                    <View style={{
                        height: 64,
                        width: 64,
                        backgroundColor: '#1f2937',
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 16
                    }}>
                        <ActivityIndicator size="large" color="#3b82f6" />
                    </View>
                    <Text style={{ fontSize: 14, color: '#9ca3af', fontWeight: '500' }}>{message}</Text>
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
