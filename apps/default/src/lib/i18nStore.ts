import { create } from 'zustand';
import { LangCode, detectLang, isRTL, t as translate, TKey, EN_STRINGS } from './i18n';
import {
  getFromCache,
  translateBatch,
  isApiConfigured,
} from './translationService';

interface I18nState {
  lang: LangCode;
  isTranslating: boolean;
  translationProgress: number; // 0–100
  setLang: (lang: LangCode) => void;
  t: (key: TKey) => string;
  preloadTranslations: (lang: LangCode) => Promise<void>;
}

function applyLang(lang: LangCode) {
  localStorage.setItem('cryptoverse_lang', lang);
  const rtl = isRTL(lang);
  document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', lang);
}

const initialLang = detectLang();
applyLang(initialLang);

export const useI18nStore = create<I18nState>((set, get) => ({
  lang: initialLang,
  isTranslating: false,
  translationProgress: 0,

  setLang: async (lang) => {
    applyLang(lang);
    set({ lang });
    // Preload translations for new language in background
    get().preloadTranslations(lang);
  },

  /**
   * Synchronous t() — checks:
   * 1. Memory/localStorage cache (instant)
   * 2. Static translation table (instant)
   * 3. Fallback: English
   */
  t: (key: TKey): string => {
    const { lang } = get();
    if (lang === 'en') return translate(key, 'en');

    // Check cache (synchronous)
    const cached = getFromCache(lang, key);
    if (cached) return cached.text;

    // Fall back to static translation table
    return translate(key, lang);
  },

  /**
   * Preload all translation keys for a language using Google API.
   * Runs in background, populates cache for future t() calls.
   * Only fires if API key is configured and language isn't English.
   */
  preloadTranslations: async (lang: LangCode) => {
    if (lang === 'en') return;
    if (!isApiConfigured()) return;

    const { isTranslating } = get();
    if (isTranslating) return;

    set({ isTranslating: true, translationProgress: 0 });

    const entries = Object.entries(EN_STRINGS).map(([key, en]) => ({ key, en }));
    // Filter out already-cached entries
    const uncached = entries.filter(e => !getFromCache(lang, e.key));

    if (uncached.length === 0) {
      set({ isTranslating: false, translationProgress: 100 });
      return;
    }

    try {
      await translateBatch(uncached, lang, (done, total) => {
        set({ translationProgress: Math.round((done / total) * 100) });
      });
    } catch (err) {
      console.warn('[i18nStore] Preload failed:', err);
    } finally {
      set({ isTranslating: false, translationProgress: 100 });
    }
  },
}));

// Preload on init for non-English languages
if (initialLang !== 'en') {
  setTimeout(() => {
    useI18nStore.getState().preloadTranslations(initialLang);
  }, 2000); // delay 2s so app starts fast
}
