'use client';

import { useLocale } from 'next-intl';
import { useTransition } from 'react';

export default function LanguageSelector() {
  const locale = useLocale();
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
      className="h-[42px] px-2 rounded-lg shadow-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-800 focus:outline-none focus:border-green-500 disabled:opacity-50 cursor-pointer"
      aria-label="Select language"
    >
      <option value="es">ES</option>
      <option value="en">EN</option>
    </select>
  );
}
