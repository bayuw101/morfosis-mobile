import { useTheme } from "../context/theme-context";

export const useDashboardStyles = () => {
    const { isDark } = useTheme();

    return {
        isDark,
        colors: {
            headerBg: isDark ? '#111827' : '#1e40af',
            headerCardBg: isDark ? 'rgba(31,41,55,0.8)' : 'rgba(255,255,255,0.15)',
            headerCardBorder: isDark ? 'rgba(55,65,81,0.6)' : 'rgba(255,255,255,0.2)',
            headerSubText: isDark ? '#9ca3af' : 'rgba(255,255,255,0.7)',
            headerMainText: '#ffffff',

            familyPillBg: isDark ? 'rgba(31,41,55,0.8)' : 'rgba(255,255,255,0.2)',
            familyPillBorder: isDark ? '#374151' : 'rgba(255,255,255,0.3)',
            familyPillText: isDark ? '#d1d5db' : 'rgba(255,255,255,0.9)',

            contentBg: isDark ? '#1f2937' : '#f8fafc',
            cardBg: isDark ? '#374151' : '#ffffff',
            cardBorder: isDark ? '#4b5563' : '#e2e8f0',

            textPrimary: isDark ? '#f9fafb' : '#0f172a',
            textSecondary: isDark ? '#9ca3af' : '#64748b',
            textMuted: isDark ? '#6b7280' : '#94a3b8',
            divider: isDark ? '#4b5563' : '#f1f5f9',

            inputBg: isDark ? '#374151' : '#f8fafc',
            inputBorder: isDark ? '#4b5563' : '#e2e8f0',

            handle: isDark ? '#4b5563' : '#cbd5e1',

            modalBg: isDark ? '#1f2937' : '#ffffff',
            modalHeaderBorder: isDark ? '#374151' : '#f1f5f9',
            modalInputBg: isDark ? '#374151' : '#f8fafc',
            modalInputBorder: isDark ? '#4b5563' : '#e2e8f0',
            closeBtnBg: isDark ? '#374151' : '#f1f5f9',
        }
    };
};
