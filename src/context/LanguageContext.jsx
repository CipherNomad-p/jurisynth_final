
import { createContext, useContext, useState, useCallback } from 'react';
import en from '../locales/en';
import fr from '../locales/fr';
import es from '../locales/es';
import de from '../locales/de';
import zh from '../locales/zh';
import ja from '../locales/ja';
import ko from '../locales/ko';
import pl from '../locales/pl';
import pt from '../locales/pt';
import nl from '../locales/nl';
import ru from '../locales/ru';
import it from '../locales/it';
import tr from '../locales/tr';
import sv from '../locales/sv';
import vi from '../locales/vi';
import id from '../locales/id';
import th from '../locales/th';
import uk from '../locales/uk';
import ar from '../locales/ar';
import hi from '../locales/hi';
import mr from '../locales/mr';

const normalizeKeys = (obj) =>
  Object.keys(obj).reduce((acc, key) => {
    acc[key.trim().toLowerCase().replace(/\s+/g, '_')] = obj[key];
    return acc;
  }, {});

const translations = {
  en: normalizeKeys(en),
  fr: normalizeKeys(fr),
  ar: normalizeKeys(ar),
  mr: normalizeKeys(mr),
  es: normalizeKeys(es),      // Spanish
  de: normalizeKeys(de),      // German
  zh: normalizeKeys(zh),      // Chinese (Simplified)
  ja: normalizeKeys(ja),      // Japanese
  ko: normalizeKeys(ko),      // Korean
  pt: normalizeKeys(pt),      // Portuguese
  ru: normalizeKeys(ru),      // Russian
  it: normalizeKeys(it),      // Italian
  nl: normalizeKeys(nl),      // Dutch
  tr: normalizeKeys(tr),      // Turkish
  hi: normalizeKeys(hi),      // Hindi
  pl: normalizeKeys(pl),      // Polish
  sv: normalizeKeys(sv),      // Swedish
  vi: normalizeKeys(vi),      // Vietnamese
  id: normalizeKeys(id),      // Indonesian
  th: normalizeKeys(th),      // Thai
  uk: normalizeKeys(uk),      // Ukrainian
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const savedLang = localStorage.getItem('lang') || 'en';
  const [lang, setLang] = useState(savedLang);

  const switchLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  const t = (key, variables = {}) => {
    if (!translations[lang]) return key;

    const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '_');
    let text = translations[lang][cleanKey] ?? key;

    Object.keys(variables).forEach((varKey) => {
      text = text.replace(`{{${varKey}}}`, variables[varKey]);
    });

    return text;
  };

  const translateDynamic = useCallback(async (text) => {
    if (!text || lang === 'en') return text; // no need if english

    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${lang}`;
      const res = await fetch(url);
      const data = await res.json();
      return data.responseData.translatedText || text;
    } catch {
      return text; // fallback to original
    }
  }, [lang]);


  return (
    <LanguageContext.Provider value={{ lang, switchLanguage, t, translateDynamic }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}