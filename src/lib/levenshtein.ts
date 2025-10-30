const similarLettersMap = {
  а: ['a', 'ā', 'á', 'à', 'â', 'ä'], // английская a, с диакритиками
  б: ['b', '6'], // английская b, цифра 6
  в: ['b', 'v', 'w'], // английские b, v, w
  г: ['g', 'r'], // английская g, иногда r
  д: ['d', 'g'], // английская d, g
  е: ['e', 'ē', 'é', 'è', 'ê', 'ë'], // английская e, с диакритиками
  ё: ['e', 'ē', 'é', 'è', 'ê', 'ë', 'yo', 'io'],
  ж: ['zh', 'j', 'g'], // транслитерации
  з: ['z', '3'], // английская z, цифра 3
  и: ['i', 'ī', 'í', 'ì', 'î', 'ï', 'u'], // английская i, u
  й: ['i', 'y', 'j'], // английские i, y, j
  к: ['k', 'c'], // английские k, c
  л: ['l', '1'], // английская l, цифра 1
  м: ['m'], // английская m
  н: ['n', 'h'], // английские n, h
  о: ['o', 'ō', 'ó', 'ò', 'ô', 'ö', '0'], // английская o, цифра 0
  п: ['p', 'n'], // английская p, n
  р: ['p', 'r'], // английские p, r
  с: ['c', 's'], // английские c, s
  т: ['t', 'm'], // английская t, m
  у: ['y', 'u'], // английские y, u
  ф: ['f', 'ph'], // английская f, ph
  х: ['h', 'x', 'kh'], // английские h, x, транслитерация
  ц: ['c', 'ts', 'tc'], // транслитерации
  ч: ['ch', '4'], // английская ch, цифра 4
  ш: ['sh', 'sch'], // транслитерации
  щ: ['shch', 'sch'], // транслитерации
  ъ: ['', '`'], // твердый знак
  ы: ['y', 'i', 'u'], // сложный звук
  ь: ['', "'", '`'], // мягкий знак
  э: ['e', 'ē', 'é', 'è', 'ê', 'ë', 'a'], // английская e, a
  ю: ['yu', 'iu', 'ju', 'u'], // транслитерации
  я: ['ya', 'ia', 'ja', 'a'], // транслитерации
};

// Вспомогательная функция для проверки схожести букв
function isSimilar(letter1: string, letter2: string) {
  const lower1 = letter1.toLowerCase();
  const lower2 = letter2.toLowerCase();

  if (lower1 === lower2) return true;

  const similar1 = similarLettersMap[lower1];
  return similar1?.includes(lower2);
}

// Улучшенная версия с дополнительными метриками
export function calculateAdvancedSimilarity(word1: string, word2: string) {
  if (!word1 || !word2) {
    return word1 === word2 ? 1 : 0;
  }

  const str1 = word1.toLowerCase();
  const str2 = word2.toLowerCase();

  if (str1 === str2) return 1;

  // Комбинируем несколько метрик
  const levenshteinScore = calculateLevenshteinSimilarity(str1, str2);
  const commonLettersScore = calculateCommonLettersScore(str1, str2);
  const phoneticScore = calculatePhoneticSimilarity(str1, str2);

  // Взвешенная сумма (можно настроить веса)
  return (
    levenshteinScore * 0.6 + commonLettersScore * 0.2 + phoneticScore * 0.2
  );
}

// Основная функция на основе расстояния Левенштейна
function calculateLevenshteinSimilarity(str1: string, str2: string) {
  const len1 = str1.length;
  const len2 = str2.length;

  const matrix = Array(len1 + 1)
    .fill(0)
    .map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = isSimilar(str1[i - 1], str2[j - 1]) ? 0.3 : 1;

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  const maxLen = Math.max(len1, len2);
  const distance = matrix[len1][len2];
  return Math.max(0, 1 - distance / maxLen);
}

// Метрика на основе общих букв
function calculateCommonLettersScore(str1: string, str2: string) {
  const set1 = new Set(str1);
  const set2 = new Set(str2);

  let commonCount = 0;
  for (const char of set1) {
    if (set2.has(char)) {
      commonCount++;
    } else {
      // Проверяем похожие буквы
      for (const char2 of set2) {
        if (isSimilar(char, char2)) {
          commonCount += 0.5;
          break;
        }
      }
    }
  }

  const maxUnique = Math.max(set1.size, set2.size);
  return commonCount / maxUnique;
}

// Простая фонетическая схожесть
function calculatePhoneticSimilarity(str1, str2) {
  // Упрощенная фонетическая нормализация
  const normalize = (str) => {
    return str
      .replace(/[ёе]/g, 'е')
      .replace(/[ий]/g, 'и')
      .replace(/[ъь]/g, '')
      .replace(/щ/g, 'шч')
      .replace(/ц/g, 'тс');
  };

  const norm1 = normalize(str1);
  const norm2 = normalize(str2);

  return calculateLevenshteinSimilarity(norm1, norm2);
}
