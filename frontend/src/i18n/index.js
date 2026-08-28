import { en } from './locales/en';
import { hi } from './locales/hi';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English', short: 'EN' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', short: 'HI' }
];

export const DEFAULT_LANGUAGE = 'en';

export const translations = {
  en,
  hi
};

/**
 * Utility helper to resolve nested translation keys like "hero.headline"
 * with automatic fallback to English and then to the provided fallback or key.
 */
export function getTranslation(lang, keyPath, fallback = '') {
  const currentLang = translations[lang] || translations[DEFAULT_LANGUAGE];
  const defaultLang = translations[DEFAULT_LANGUAGE];

  const resolve = (obj, path) => {
    if (!obj || !path) return undefined;
    const parts = path.split('.');
    let curr = obj;
    for (const p of parts) {
      if (curr && typeof curr === 'object' && p in curr) {
        curr = curr[p];
      } else {
        return undefined;
      }
    }
    return curr;
  };

  const val = resolve(currentLang, keyPath);
  if (val !== undefined && val !== null) return val;

  const defaultVal = resolve(defaultLang, keyPath);
  if (defaultVal !== undefined && defaultVal !== null) return defaultVal;

  return fallback || keyPath;
}
