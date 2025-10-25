export function levenshtein(source: string, target: string) {
  /// Calculates the Levenshtein distance between two strings.
  const sourceLen = source.length;
  const targetLen = target.length;

  if (sourceLen === 0) return targetLen;
  if (targetLen === 0) return sourceLen;

  const matrix: number[][] = Array.from({ length: sourceLen + 1 }, () =>
    Array(targetLen + 1).fill(0),
  );

  for (let i = 0; i <= sourceLen; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= targetLen; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= sourceLen; i++) {
    for (let j = 1; j <= targetLen; j++) {
      const cost = source[i - 1] === target[j - 1] ? 0 : 1;

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // Deletion
        matrix[i][j - 1] + 1, // Insertion
        matrix[i - 1][j - 1] + cost, // Substitution
      );
    }
  }

  return matrix[sourceLen][targetLen];
}
