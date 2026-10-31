import { arrayUnion, writeBatch, addDoc, collection, doc, getCountFromServer, getDoc, getDocs, onSnapshot, query, where, serverTimestamp, Timestamp, updateDoc, type DocumentData, type FirestoreError } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { normalizeWordValues, readWordDetails, uniqueFieldNames, type WordDetail, type WordValues } from "@/lib/wordFields";

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
  reading?: string;
  partOfSpeech?: string;
  inflections?: string;
  customFields?: WordDetail[];
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
    const words = collection(db, language.id);
    const [countSnapshot, namedDocuments] = await Promise.all([
      getCountFromServer(words),
      getDocs(query(words, where("name", "!=", null))),
    ]);
    const metadataCount = namedDocuments.docs.filter((document) => !isWordData(document.data())).length;

    return { ...language, wordCount: countSnapshot.data().count - metadataCount };
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
  return snapshot.exists() && isWordData(snapshot.data())
    ? toWordItem(snapshot.id, snapshot.data())
    : null;
}

// Bootstrap old field names once per folder; subsequent reads use the folder catalog.
export async function getCustomFieldNames(languageId: string): Promise<string[]> {
  const reference = doc(db, "languages", languageId);
  const folder = await getDoc(reference);
  if (!folder.exists()) throw new Error("폴더를 찾을 수 없습니다.");
  const names = uniqueFieldNames(folder.data().customFieldNames);
  if (folder.data().customFieldNamesInitialized === true) return names;

  const words = await getDocs(collection(db, languageId));
  const discovered = uniqueFieldNames([
    ...names,
    ...words.docs.filter((word) => isWordData(word.data())).flatMap((word) => readWordDetails(word.data()).customFields.map(({ label }) => label)),
  ]);
  await updateDoc(reference, {
    customFieldNamesInitialized: true,
    ...(discovered.length ? { customFieldNames: arrayUnion(...discovered) } : {}),
  });
  return discovered;
}

export async function createWord(languageId: string, values: WordValues): Promise<string> {
  if (!languageId) throw new Error("언어 목록에서 다시 선택해 주세요.");
  const normalized = normalizeWordValues(values);
  const reference = doc(collection(db, languageId));
  const batch = writeBatch(db);
  batch.set(reference, { ...normalized, createdAt: serverTimestamp(), savedAt: serverTimestamp() });
  const names = uniqueFieldNames(normalized.customFields?.map(({ label }) => label));
  if (names.length) batch.update(doc(db, "languages", languageId), { customFieldNames: arrayUnion(...names) });
  await batch.commit();
  return reference.id;
}

export async function updateWord(languageId: string, wordId: string, values: WordValues): Promise<void> {
  const normalized = normalizeWordValues(values);
  const batch = writeBatch(db);
  batch.update(doc(db, languageId, wordId), { ...normalized, updatedAt: serverTimestamp() });
  const names = uniqueFieldNames(normalized.customFields?.map(({ label }) => label));
  if (names.length) batch.update(doc(db, "languages", languageId), { customFieldNames: arrayUnion(...names) });
  await batch.commit();
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
        .filter((document) => isWordData(document.data()))
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

// Legacy folders can contain name-only metadata alongside vocabulary documents.
// Keep legacy name-based words only when they also contain a definition.
function isWordData(data: DocumentData): boolean {
  return Boolean(
    getString(data.word) ?? getString(data.term)
    ?? (getString(data.name) && (getString(data.meaning) ?? getString(data.definition))),
  );
}

function toWordItem(id: string, data: DocumentData): WordItem {
  return {
    id,
    word: getString(data.word) ?? getString(data.term) ?? getString(data.name) ?? id,
    meaning: getString(data.meaning) ?? getString(data.definition) ?? "",
    ...readWordDetails(data),
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
