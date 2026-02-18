'use client';

import { useI18n } from '@/contexts/I18nContext';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span className="font-semibold text-gray-900 dark:text-white">Lingua / Language</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setLocale('it')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              locale === 'it'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            🇮🇹 Italiano
          </button>
          <button
            onClick={() => setLocale('en')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              locale === 'en'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            🇬🇧 English
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
        {locale === 'it' 
          ? 'Seleziona la lingua dell\'interfaccia'
          : 'Select the interface language'}
      </p>
    </div>
  );
}
