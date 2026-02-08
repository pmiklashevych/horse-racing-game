export function shuffleArray<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function pickUnique<T>(input: T[], count: number): T[] {
  if (count > input.length) {
    throw new Error(`Cannot pick ${count} unique items from ${input.length} records.`);
  }

  return shuffleArray(input).slice(0, count);
}
