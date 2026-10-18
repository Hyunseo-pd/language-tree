import { collection, getCountFromServer, getDocs, onSnapshot, Timestamp, type DocumentData, type FirestoreError } from "firebase/firestore";

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
  createdAt?: number;
  savedAt?: number;
};

type SnapshotSuccess<T> = (items: T[]) => void;
type SnapshotError = (error: FirestoreError) => void;

export async function getLanguages(): Promise<LanguageFolder[]> {
  const snapshot = await getDocs(collection(db, "languages"));

  return Promise.all(snapshot.docs.map(async (doc) => {
    const language = toLanguageFolder(doc.id, doc.data());
    const countSnapshot = await getCountFromServer(collection(db, language.id));

    return { ...language, wordCount: countSnapshot.data().count };
  }));
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
    createdAt: getTimestampMillis(data.createdAt),
    savedAt: getTimestampMillis(data.savedAt),
  };
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}


function getTimestampMillis(value: unknown): number | undefined {
  const milliseconds = value instanceof Timestamp
    ? value.toMillis()
    : value instanceof Date
      ? value.getTime()
      : typeof value === "string"
        ? Date.parse(value)
        : typeof value === "number"
          ? value
          : undefined;

  return milliseconds !== undefined && Number.isFinite(milliseconds)
    ? milliseconds
    : undefined;
}
