import { View, Animated, ViewStyle, StyleProp } from "react-native";
import { useDashboardStyles } from "../../hooks/use-dashboard-styles";
import { ReactNode } from "react";

interface DashboardSheetProps {
    children: ReactNode;
    style?: StyleProp<ViewStyle>;
    animatedStyle?: any; // For Animated.View styling props
}

export const DashboardSheet = ({ children, style, animatedStyle }: DashboardSheetProps) => {
    const { colors } = useDashboardStyles();

    const baseStyle = {
        flex: 1,
        backgroundColor: colors.contentBg,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        overflow: 'hidden' as const,
    };

    const handle = (
        <View className="items-center pt-3 pb-2">
            <View style={{ backgroundColor: colors.handle }} className="w-10 h-1 rounded-full" />
        </View>
    );

    if (animatedStyle) {
        return (
            <Animated.View style={[baseStyle, style, animatedStyle]}>
                {handle}
                {children}
            </Animated.View>
        );
    }

    return (
        <View style={[baseStyle, style]}>
            {handle}
            {children}
        </View>
    );
};
