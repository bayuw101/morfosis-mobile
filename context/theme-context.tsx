import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
    themeMode: ThemeMode;
    resolvedTheme: ResolvedTheme;
    setThemeMode: (mode: ThemeMode) => void;
    isDark: boolean;
}

const THEME_STORAGE_KEY = 'app_theme_mode';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const deviceColorScheme = useDeviceColorScheme();
    const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
    const [isLoaded, setIsLoaded] = useState(false);

    // Load saved theme preference on mount
    useEffect(() => {
        const loadTheme = async () => {
            try {
                // First try the new storage key
                const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
                if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
                    setThemeModeState(savedMode as ThemeMode);
                } else {
                    // Fallback: check if there's a theme in app_preferences (old location)
                    const oldPrefs = await AsyncStorage.getItem('app_preferences');
                    if (oldPrefs) {
                        const prefs = JSON.parse(oldPrefs);
                        if (prefs.theme && ['light', 'dark', 'system'].includes(prefs.theme)) {
                            setThemeModeState(prefs.theme as ThemeMode);
                        }
                    }
                }
            } catch (e) {
                console.error('Failed to load theme preference:', e);
            } finally {
                setIsLoaded(true);
            }
        };
        loadTheme();
    }, []);

    const setThemeMode = useCallback(async (mode: ThemeMode) => {
        setThemeModeState(mode);
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
            // Also update app_preferences for backwards compatibility
            const oldPrefs = await AsyncStorage.getItem('app_preferences');
            const prefs = oldPrefs ? JSON.parse(oldPrefs) : {};
            prefs.theme = mode;
            await AsyncStorage.setItem('app_preferences', JSON.stringify(prefs));
        } catch (e) {
            console.error('Failed to save theme preference:', e);
        }
    }, []);

    const resolvedTheme: ResolvedTheme = useMemo(() => {
        if (themeMode === 'system') {
            return deviceColorScheme === 'dark' ? 'dark' : 'light';
        }
        return themeMode;
    }, [themeMode, deviceColorScheme]);

    const isDark = resolvedTheme === 'dark';

    const value = useMemo(
        () => ({ themeMode, resolvedTheme, setThemeMode, isDark }),
        [themeMode, resolvedTheme, setThemeMode, isDark]
    );

    // Don't render until theme is loaded to prevent flash
    if (!isLoaded) {
        return null;
    }

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextType {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
