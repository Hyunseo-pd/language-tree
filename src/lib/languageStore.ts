import { addDoc, collection, doc, getCountFromServer, getDoc, getDocs, onSnapshot, serverTimestamp, Timestamp, updateDoc, type DocumentData, type FirestoreError } from "firebase/firestore";

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

export async function getLanguageName(languageId: string): Promise<string | undefined> {
  const snapshot = await getDoc(doc(db, "languages", languageId));
  return snapshot.exists() ? getString(snapshot.data().name) : undefined;
}

export async function getLanguages(): Promise<LanguageFolder[]> {
  const snapshot = await getDocs(collection(db, "languages"));

  return Promise.all(snapshot.docs.map(async (doc) => {
    const language = toLanguageFolder(doc.id, doc.data());
    const countSnapshot = await getCountFromServer(collection(db, language.id));

    return { ...language, wordCount: countSnapshot.data().count };
  }));
}

export async function createLanguage(name: string): Promise<LanguageFolder> {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("폴더 이름을 입력해 주세요.");
  const reference = await addDoc(collection(db, "languages"), {
    name: trimmedName,
    createdAt: serverTimestamp(),
  });
  return { id: reference.id, name: trimmedName, wordCount: 0 };
}

export async function renameLanguage(languageId: string, name: string): Promise<void> {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("폴더 이름을 입력해 주세요.");
  await updateDoc(doc(db, "languages", languageId), {
    name: trimmedName,
    updatedAt: serverTimestamp(),
  });
}

export async function getWord(languageId: string, wordId: string): Promise<WordItem | null> {
  const snapshot = await getDoc(doc(db, languageId, wordId));
  return snapshot.exists() ? toWordItem(snapshot.id, snapshot.data()) : null;
}

export async function createWord(
  languageId: string,
  values: Pick<WordItem, "word" | "meaning" | "example">,
): Promise<string> {
  const word = values.word.trim();
  const meaning = values.meaning.trim();
  if (!languageId || !word || !meaning) {
    throw new Error("언어, 단어와 뜻을 모두 입력해 주세요.");
  }
  const reference = await addDoc(collection(db, languageId), {
    word,
    meaning,
    example: values.example?.trim() ?? "",
    createdAt: serverTimestamp(),
    savedAt: serverTimestamp(),
  });
  return reference.id;
}

export async function updateWord(
  languageId: string,
  wordId: string,
  values: Pick<WordItem, "word" | "meaning" | "example">,
): Promise<void> {
  const word = values.word.trim();
  const meaning = values.meaning.trim();
  if (!word || !meaning) {
    throw new Error("Word and meaning are required.");
  }

  await updateDoc(doc(db, languageId, wordId), {
    word,
    meaning,
    example: values.example?.trim() ?? "",
    updatedAt: serverTimestamp(),
  });
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
