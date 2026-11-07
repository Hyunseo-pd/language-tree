import { doc, increment, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { WordItem } from "@/lib/languageStore";

export type TestSelection = "random" | "newest" | "oldest";

export function selectTestWords(words: WordItem[], count: number, selection: TestSelection) {
  const result = [...words];
  if (selection === "random") {
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
  } else {
    result.sort((a, b) => {
      const aDate = a.savedAt ?? a.createdAt;
      const bDate = b.savedAt ?? b.createdAt;
      if (aDate === undefined) return bDate === undefined ? a.id.localeCompare(b.id) : 1;
      if (bDate === undefined) return -1;
      return (selection === "newest" ? bDate - aDate : aDate - bDate) || a.id.localeCompare(b.id);
    });
  }
  return result.slice(0, count);
}

export async function completeCardTest(languageId: string, wordIds: string[]) {
  if (!languageId || !wordIds.length || wordIds.length > 50) throw new Error("잘못된 테스트입니다.");
  const batch = writeBatch(db);
  wordIds.forEach((wordId) => batch.set(doc(db, "languages", languageId, "studyWords", wordId), {
    testCount: increment(1),
  }, { merge: true }));
  await batch.commit();
}
