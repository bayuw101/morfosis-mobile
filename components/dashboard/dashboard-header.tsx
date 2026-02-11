import { View, Text, Pressable, Image } from "react-native";
import { Edit2, Users, ChevronDown } from "lucide-react-native";
import { useLanguage } from "../../context/language-context";
import { useDashboardStyles } from "../../hooks/use-dashboard-styles";

interface DashboardHeaderProps {
    user: any;
    activeFamily: any;
    onProfilePress: () => void;
    onFamilyPress: () => void;
}

export const DashboardHeader = ({ user, activeFamily, onProfilePress, onFamilyPress }: DashboardHeaderProps) => {
    const { t } = useLanguage();
    const { colors, isDark } = useDashboardStyles();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('greetings.morning');
        if (hour < 17) return t('greetings.afternoon');
        return t('greetings.evening');
    };

    return (
        <View className="flex-row items-center justify-between mb-5">
            <Pressable onPress={onProfilePress} className="flex-row items-center gap-3 active:opacity-80">
                <View style={{
                    borderColor: isDark ? '#4b5563' : 'rgba(255,255,255,0.4)',
                }} className="h-12 w-12 bg-white/20 rounded-full items-center justify-center overflow-hidden border-2">
                    {user?.picture ? (
                        <Image source={{ uri: user.picture }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                        <Text className="font-bold text-white text-lg">{user?.name?.charAt(0) || "U"}</Text>
                    )}
                </View>
                <View>
                    <Text style={{ color: colors.headerSubText }} className="text-[10px] font-medium uppercase tracking-wider">{getGreeting()}</Text>
                    <View className="flex-row items-center gap-1.5">
                        <Text className="text-lg font-bold text-white">{user?.name?.split(' ')[0] || "User"}</Text>
                        <Edit2 size={11} color={colors.headerSubText} />
                    </View>
                </View>
            </Pressable>

            <Pressable
                style={{
                    backgroundColor: colors.familyPillBg,
                    borderColor: colors.familyPillBorder,
                }}
                className="flex-row items-center border rounded-full px-3 py-2 gap-2 active:opacity-80"
                onPress={onFamilyPress}
            >
                <View className="h-5 w-5 rounded-full bg-blue-400/30 items-center justify-center">
                    <Users size={10} color="#93c5fd" />
                </View>
                <Text style={{ color: colors.familyPillText }} className="text-xs font-semibold">{activeFamily?.name || "My Family"}</Text>
                <ChevronDown size={12} color={colors.familyPillText} />
            </Pressable>
        </View>
    );
};
