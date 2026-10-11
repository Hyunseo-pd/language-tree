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

  return onSnapshot(
    collection(db, "languages"),
    (snapshot) => {
      const languages = snapshot.docs.map((doc) => toLanguageFolder(doc.id, doc.data()));
      onSuccess(languages);
    },
    onError
  );
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

function toLanguageFolder(id: string, data: DocumentData): LanguageFolder {
  return {
    id,
    name: getString(data.name) ?? id,
    description: getString(data.description),
    wordCount: typeof data.wordCount === "number" ? data.wordCount : undefined,
  };
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

