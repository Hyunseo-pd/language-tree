import { useSyncExternalStore } from "react";

import type { WordItem } from "./languageStore";

export type WordSortOrder = "alphabetical" | "date" | "random";
type WordSort = { order: WordSortOrder; randomIds: readonly string[] };

// Session-only, per-language preferences shared by the list and card screens.
const defaultSort: WordSort = { order: "alphabetical", randomIds: [] };
const preferences = new Map<string, WordSort>();
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function useWordSort(languageId: string | undefined): WordSort {
  return useSyncExternalStore(
    subscribe,
    () => languageId ? preferences.get(languageId) ?? defaultSort : defaultSort,
    () => defaultSort,
  );
}

export function selectWordSort(languageId: string, order: WordSortOrder, words: WordItem[]) {
  const randomIds = order === "random" ? words.map(({ id }) => id) : [];
  for (let i = randomIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [randomIds[i], randomIds[j]] = [randomIds[j], randomIds[i]];
  }
  preferences.set(languageId, { order, randomIds });
  listeners.forEach((listener) => listener());
}

export function sortWords(words: WordItem[], { order, randomIds }: WordSort): WordItem[] {
  const ranks = new Map(randomIds.map((id, index) => [id, index]));
  return [...words].sort((a, b) => {
    if (order === "random") {
      // New words follow the existing shuffled sequence without reshuffling it.
      const difference = (ranks.get(a.id) ?? Infinity) - (ranks.get(b.id) ?? Infinity);
      if (difference) return difference;
    }
    if (order === "date") {
      const aDate = a.savedAt ?? a.createdAt;
      const bDate = b.savedAt ?? b.createdAt;
      if (aDate === undefined && bDate !== undefined) return 1;
      if (aDate !== undefined && bDate === undefined) return -1;
      if (aDate !== undefined && bDate !== undefined && aDate !== bDate) return bDate - aDate;
    }
    return a.word.localeCompare(b.word, undefined, { sensitivity: "base" })
      || a.id.localeCompare(b.id);
  });
}
