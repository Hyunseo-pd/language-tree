import { collection, onSnapshot, type DocumentData, type FirestoreError } from "firebase/firestore";

import { db } from "@/lib/firebase";

export type LanguageFolder = {
  id: string;
  name: string;
  description?: string;
  wordCount?: number;
};

export type WordItem = {
  id: string;
  word: string;
  meaning: string;
  example?: string;
};

type SnapshotSuccess<T> = (items: T[]) => void;
type SnapshotError = (error: FirestoreError) => void;

export function subscribeToLanguages(
  onSuccess: SnapshotSuccess<LanguageFolder>,
  onError: SnapshotError,
) {
  onSuccess([
    { id: "germanwords", name: "독일어" },
    { id: "japanesewords", name: "일본어" },
  ]);

  return () => {};
}

export function subscribeToWords(
  languageId: string,
  onSuccess: SnapshotSuccess<WordItem>,
  onError: SnapshotError,
) {
  return onSnapshot(
    collection(db, languageId),
    (snapshot) => {
      const words = snapshot.docs
        .map((doc) => toWordItem(doc.id, doc.data()))
        .sort((a, b) => a.word.localeCompare(b.word));

      onSuccess(words);
    },
    onError,
  );
}

function toWordItem(id: string, data: DocumentData): WordItem {
  return {
    id,
    word: getString(data.word) ?? getString(data.term) ?? id,
    meaning: getString(data.meaning) ?? getString(data.definition) ?? "",
    example: getString(data.example),
  };
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

