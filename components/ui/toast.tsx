import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
import { View, Text, Animated, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, X, AlertTriangle, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../context/theme-context';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastContextType {
    show: (message: string, type?: ToastType) => void;
    hide: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [type, setType] = useState<ToastType>('info');

    // Animation value for translateY
    const translateY = useRef(new Animated.Value(-100)).current;

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const show = useCallback((msg: string, t: ToastType = 'info') => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        setMessage(msg);
        setType(t);
        setVisible(true);

        translateY.setValue(-100);
        Animated.spring(translateY, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
        }).start();

        timeoutRef.current = setTimeout(() => {
            hide();
        }, 3000);
    }, []);

    const hide = useCallback(() => {
        Animated.timing(translateY, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setVisible(false);
        });
    }, []);

    const getIcon = () => {
        switch (type) {
            case 'success': return <Check size={20} color="#22c55e" />;
            case 'error': return <X size={20} color="#ef4444" />;
            case 'warning': return <AlertTriangle size={20} color="#f59e0b" />;
            default: return <AlertCircle size={20} color="#3b82f6" />;
        }
    };

    const colors = () => {
        const baseBg = isDark ? '#1f2937' : '#ffffff';
        const border = isDark ? '#374151' : '#e2e8f0';
        return { bg: baseBg, border };
    };

    const scheme = colors();

    return (
        <ToastContext.Provider value={{ show, hide }}>
            {children}
            {visible && (
                <Animated.View
                    style={{
                        position: 'absolute',
                        top: insets.top + 10,
                        left: 20,
                        right: 20,
                        transform: [{ translateY }],
                        backgroundColor: scheme.bg,
                        borderColor: scheme.border,
                        borderWidth: 1,
                        borderRadius: 16,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 10,
                        elevation: 5,
                        zIndex: 9999,
                        overflow: 'hidden',
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 16
                    }}
                >
                    <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }} className="h-10 w-10 rounded-full items-center justify-center mr-3">
                        {getIcon()}
                    </View>
                    <View className="flex-1 mr-2">
                        <Text style={{ color: isDark ? '#f9fafb' : '#0f172a' }} className="font-semibold text-sm">
                            {message}
                        </Text>
                    </View>
                    <Pressable onPress={hide} className="p-1 rounded-full active:opacity-50">
                        <X size={16} color={isDark ? '#9ca3af' : '#94a3b8'} />
                    </Pressable>
                </Animated.View>
            )}
        </ToastContext.Provider>
    );
};
