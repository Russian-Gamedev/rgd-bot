export class XMLNormalizer {
  static toArray<T>(value: T | T[]): T[] {
    return Array.isArray(value) ? value : [value];
  }

  static getAttribute(obj: object, key: string): string | undefined;
  static getAttribute(obj: object, key: string, fallback: string): string;
  static getAttribute(
    obj: object,
    key: string,
    fallback?: string,
  ): string | undefined {
    return obj?.[`@_${key}`] ?? fallback;
  }

  static getText(obj: object): string | undefined;
  static getText(obj: object, fallback: string): string;
  static getText(obj: object, fallback?: string): string | undefined {
    return String(obj?.['#text'] ?? fallback);
  }
}

const flags: Record<string, RegExp> = {
  '🇬🇧': /[A-Za-z]/,
  '🇷🇺': /[А-Яа-яЁё]/,
  '🔢': /[0-9]/,
};

export function getFlags(text: string): string[] {
  const result: string[] = [];
  for (const [flag, regex] of Object.entries(flags)) {
    if (regex.test(text)) {
      result.push(flag);
    }
  }
  return result;
}
