import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { FaGlobe, FaChevronDown } from 'react-icons/fa';

const languages = [
  { code: 'en', label: 'English' }, { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' }, { code: 'zh', label: '中文' },
  { code: 'es', label: 'Español' }, { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' }, { code: 'ru', label: 'Русский' },
  { code: 'ja', label: '日本語' }, { code: 'ko', label: '한국어' },
  { code: 'hi', label: 'हिन्दी' }, { code: 'it', label: 'Italiano' },
  { code: 'nl', label: 'Nederlands' }, { code: 'pl', label: 'Polski' },
  { code: 'tr', label: 'Türkçe' }, { code: 'sv', label: 'Svenska' },
  { code: 'th', label: 'ไทย' }, { code: 'vi', label: 'Tiếng Việt' },
  { code: 'id', label: 'Bahasa Indonesia' }, { code: 'uk', label: 'Українська' },
  { code: 'mr', label: 'मराठी' }
];

export default function LanguageSwitcher() {
  const { lang, switchLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = languages.find(l => l.code === lang) || languages[0];

  return (
    <div className="glass-lang-wrapper" ref={dropdownRef}>
      <button className="glass-trigger" onClick={() => setIsOpen(!isOpen)}>
        <FaGlobe className="icon-globe" />
        <span className="lang-code">
          {currentLang.code.toUpperCase()}
        </span>
      
        <FaChevronDown className={`icon-chevron ${isOpen ? 'up' : ''}`} />
      </button>

      {isOpen && (
        <div className="glass-dropdown">
          {languages.map((l) => (
            <div
              key={l.code}
              className={`glass-option ${lang === l.code ? 'active' : ''}`}
              onClick={() => {
                switchLanguage(l.code);
                setIsOpen(false);
              }}
            >
              {l.label}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}