'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';

export default function LanguageSelector() {
  const locale = useLocale();
  const t = useTranslations('language');
  const [isPending, startTransition] = useTransition();

  const handleChange = (newLocale: string) => {
    startTransition(() => {
      document.cookie = `locale=${newLocale};path=/;max-age=31536000`;
      window.location.reload();
    });
  };

  return (
    <select
      value={locale}
      onChange={(e) => handleChange(e.target.value)}
      disabled={isPending}
      className="bg-gray-900 text-white text-sm rounded-lg px-2 py-2.5 border border-gray-700 hover:bg-gray-800 focus:outline-none focus:border-green-500 disabled:opacity-50 cursor-pointer"
      aria-label="Select language"
    >
      <option value="es">{t('es')}</option>
      <option value="en">{t('en')}</option>
    </select>
  );
}
