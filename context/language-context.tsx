import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createTranslator, LanguageCode, translations } from '../lib/i18n';

interface LanguageContextType {
    language: LanguageCode;
    setLanguage: (lang: LanguageCode) => void;
    t: (key: string) => string;
}

const LANGUAGE_STORAGE_KEY = 'app_language';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<LanguageCode>('en');
    const [isLoaded, setIsLoaded] = useState(false);

    // Load saved language preference on mount
    useEffect(() => {
        const loadLanguage = async () => {
            try {
                // First try the new storage key
                const savedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
                if (savedLang && (savedLang === 'en' || savedLang === 'id')) {
                    setLanguageState(savedLang as LanguageCode);
                } else {
                    // Fallback: check if there's a language in app_preferences (old location)
                    const oldPrefs = await AsyncStorage.getItem('app_preferences');
                    if (oldPrefs) {
                        const prefs = JSON.parse(oldPrefs);
                        if (prefs.language && (prefs.language === 'en' || prefs.language === 'id')) {
                            setLanguageState(prefs.language as LanguageCode);
                        }
                    }
                }
            } catch (e) {
                console.error('Failed to load language preference:', e);
            } finally {
                setIsLoaded(true);
            }
        };
        loadLanguage();
    }, []);

    const setLanguage = useCallback(async (lang: LanguageCode) => {
        setLanguageState(lang);
        try {
            await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
            // Also update app_preferences for backwards compatibility
            const oldPrefs = await AsyncStorage.getItem('app_preferences');
            const prefs = oldPrefs ? JSON.parse(oldPrefs) : {};
            prefs.language = lang;
            await AsyncStorage.setItem('app_preferences', JSON.stringify(prefs));
        } catch (e) {
            console.error('Failed to save language preference:', e);
        }
    }, []);

    const t = useMemo(() => createTranslator(language), [language]);

    const value = useMemo(
        () => ({ language, setLanguage, t }),
        [language, setLanguage, t]
    );

    // Don't render until language is loaded to prevent flash
    if (!isLoaded) {
        return null;
    }

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage(): LanguageContextType {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
