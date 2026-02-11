import { Tabs, useRouter } from "expo-router";
import { View, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Home, Receipt, PieChart, Settings, Plus } from "lucide-react-native";
import { TransactionModalProvider, useTransactionModal } from "../../context/transaction-modal-context";
import { FamilyProvider } from "../../context/family-context";
import { TransactionFormModal } from "../../components/transaction-form-modal";
import { useState } from "react";
import { useTheme } from "../../context/theme-context";

function DashboardTabs() {
    const { openModal } = useTransactionModal();
    const { isDark } = useTheme();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarActiveTintColor: '#2563eb',
                tabBarInactiveTintColor: isDark ? '#6b7280' : '#94a3b8',
                tabBarStyle: {
                    height: Platform.OS === 'ios' ? 80 : 60,
                    borderTopWidth: 0,
                    backgroundColor: isDark ? '#111827' : '#ffffff',
                    elevation: 20,
                    shadowColor: isDark ? "#000" : "#000",
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: isDark ? 0.3 : 0.1,
                    shadowRadius: 12,
                    paddingTop: 10,
                    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
                },
                tabBarItemStyle: {
                    justifyContent: 'center',
                    alignItems: 'center',
                }
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ focused }: { focused: boolean }) => (
                        <Home size={24} color={focused ? "#2563eb" : "#94a3b8"} strokeWidth={focused ? 2.5 : 2} />
                    )
                }}
            />

            <Tabs.Screen
                name="transactions"
                options={{
                    title: "Transactions",
                    tabBarIcon: ({ focused }: { focused: boolean }) => (
                        <Receipt size={24} color={focused ? "#2563eb" : "#94a3b8"} strokeWidth={focused ? 2.5 : 2} />
                    )
                }}
            />

            <Tabs.Screen
                name="action"
                listeners={{
                    tabPress: (e) => {
                        e.preventDefault();
                        openModal();
                    },
                }}
                options={{
                    title: "",
                    tabBarIcon: ({ focused }: { focused: boolean }) => (
                        <View
                            style={{
                                position: 'absolute',
                                top: -24,
                                width: 56,
                                height: 56,
                                borderRadius: 28,
                                backgroundColor: "#2563eb",
                                alignItems: "center",
                                justifyContent: "center",
                                shadowColor: "#2563eb",
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.35,
                                shadowRadius: 10,
                                elevation: 8,
                                borderWidth: 4,
                                borderColor: isDark ? "#111827" : "#ffffff"
                            }}
                        >
                            <Plus size={26} color="#ffffff" strokeWidth={3} />
                        </View>
                    ),
                }}
            />

            <Tabs.Screen
                name="planning"
                options={{
                    title: "Planning",
                    tabBarIcon: ({ focused }: { focused: boolean }) => (
                        <PieChart size={24} color={focused ? "#2563eb" : "#94a3b8"} strokeWidth={focused ? 2.5 : 2} />
                    )
                }}
            />

            <Tabs.Screen
                name="settings"
                options={{
                    title: "Settings",
                    tabBarIcon: ({ focused }: { focused: boolean }) => (
                        <Settings size={24} color={focused ? "#2563eb" : "#94a3b8"} strokeWidth={focused ? 2.5 : 2} />
                    )
                }}
            />

            <Tabs.Screen
                name="budget"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="analysis"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}

function ModalContainer() {
    const { isOpen, initialType, initialAccountId, closeModal, triggerRefresh } = useTransactionModal();
    return (
        <TransactionFormModal
            visible={isOpen}
            initialType={initialType}
            initialAccountId={initialAccountId}
            onClose={closeModal}
            onSuccess={() => {
                closeModal();
                triggerRefresh();
            }}
        />
    );
}

export default function DashboardLayout() {
    return (
        <FamilyProvider>
            <TransactionModalProvider>
                <StatusBar style="light" translucent backgroundColor="transparent" />
                <DashboardTabs />
                <ModalContainer />
            </TransactionModalProvider>
        </FamilyProvider>
    );
}

