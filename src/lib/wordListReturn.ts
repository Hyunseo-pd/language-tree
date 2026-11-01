let sequence = 0;
const positions = new Map<string, { id: string; sequence: number }>();

export function rememberCardWord(languageId: string, id: string) {
  positions.set(languageId, { id, sequence: ++sequence });
}

export function getCardReturn(languageId: string) {
  return positions.get(languageId);
}

export function clearCardReturn(languageId: string, expectedSequence: number) {
  if (positions.get(languageId)?.sequence === expectedSequence) positions.delete(languageId);
}
