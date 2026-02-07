import React, { ReactNode } from 'react';
import messages from '../../../messages/es.json';

// Get nested value from object using dot notation
function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

// Mock translation function
function createTranslationFunction(namespace?: string) {
  const t = (key: string, values?: Record<string, any>): string => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    let value = getNestedValue(messages, fullKey);

    if (value === undefined) {
      return fullKey;
    }

    // Handle interpolation
    if (values && typeof value === 'string') {
      let result = value;
      Object.entries(values).forEach(([k, v]) => {
        result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
      return result;
    }

    return value;
  };

  // Add raw function for accessing raw values
  t.raw = (key: string): any => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    return getNestedValue(messages, fullKey);
  };

  // Add rich function for rich text interpolation
  t.rich = (key: string, values?: Record<string, (chunks: ReactNode) => ReactNode>): ReactNode => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    let value = getNestedValue(messages, fullKey);

    if (value === undefined) {
      return fullKey;
    }

    // Simple implementation of rich text - replace <tag>content</tag> with the corresponding function
    if (values) {
      const parts: ReactNode[] = [];
      let remaining = value;
      let key = 0;

      Object.entries(values).forEach(([tagName, fn]) => {
        const regex = new RegExp(`<${tagName}>(.*?)</${tagName}>`, 'g');
        let match;
        let lastIndex = 0;

        while ((match = regex.exec(remaining)) !== null) {
          if (match.index > lastIndex) {
            parts.push(remaining.slice(lastIndex, match.index));
          }
          parts.push(<React.Fragment key={key++}>{fn(match[1])}</React.Fragment>);
          lastIndex = match.index + match[0].length;
        }

        if (lastIndex < remaining.length) {
          parts.push(remaining.slice(lastIndex));
        }

        if (parts.length > 0) {
          remaining = '';
        }
      });

      if (parts.length > 0) {
        return <>{parts}</>;
      }
    }

    return value;
  };

  return t;
}

// Mock useTranslations hook
export function useTranslations(namespace?: string) {
  return createTranslationFunction(namespace);
}

// Mock useLocale hook
export function useLocale() {
  return 'es';
}

// Mock NextIntlClientProvider
export function NextIntlClientProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

// Mock getTranslations for server components
export async function getTranslations(namespace?: string) {
  return createTranslationFunction(namespace);
}

// Mock getLocale for server components
export async function getLocale() {
  return 'es';
}

// Mock getMessages for server components
export async function getMessages() {
  return messages;
}
