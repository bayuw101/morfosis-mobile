/**
 * i18n index - translation helper and exports
 */
import { en, TranslationKeys } from './en';
import { id } from './id';

export type LanguageCode = 'en' | 'id';

export const translations: Record<LanguageCode, TranslationKeys> = {
    en,
    id,
};

/**
 * Get a nested translation value by dot-notation path
 * e.g., getNestedValue(translations.en, 'settings.title') => 'Settings'
 */
export function getNestedValue(obj: any, path: string): string {
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
        if (result && typeof result === 'object' && key in result) {
            result = result[key];
        } else {
            return path; // Return the path itself if not found
        }
    }
    return typeof result === 'string' ? result : path;
}

/**
 * Create a translation function for a given language
 */
export function createTranslator(lang: LanguageCode) {
    const translation = translations[lang] || translations.en;

    return function t(key: string): string {
        return getNestedValue(translation, key);
    };
}

export { en, id };
export type { TranslationKeys };
