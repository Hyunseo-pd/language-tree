export const optionalWordFields = [
  { key: "reading", label: "읽는 방법", placeholder: "발음이나 읽는 방법을 입력하세요" },
  { key: "partOfSpeech", label: "품사", placeholder: "예: 명사, 동사, 형용사" },
  { key: "inflections", label: "변화형", placeholder: "활용형, 과거형, 복수형 등을 입력하세요" },
  { key: "example", label: "예문", placeholder: "기억하고 싶은 예문을 남겨 보세요" },
] as const;

export type OptionalWordField = typeof optionalWordFields[number]["key"];
export type WordValues = { word: string; meaning: string } & Partial<Record<OptionalWordField, string>>;
export type WordDetail = { label: string; value: string };

const legacyLabels: Record<string, string> = {
  partizip2: "과거분사", Präteritum: "과거형", auxiliary: "조동사",
  plural: "복수형", comparative: "비교급", gender: "성 / 관사", usage: "용법",
  readingType: "읽기 유형", adjectiveType: "형용사 유형",
};
const inflectionKeys = ["Präteritum", "partizip2", "auxiliary", "plural", "comparative"];

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
}

function displayValue(value: unknown): string | undefined {
  if (Array.isArray(value)) return value.map(displayValue).filter(Boolean).join(", ") || undefined;
  if (value !== null && typeof value === "object") {
    return Object.entries(record(value)).map(([key, item]) => {
      const content = displayValue(item);
      return content ? `${legacyLabels[key] ?? key}: ${content}` : "";
    }).filter(Boolean).join("\n") || undefined;
  }
  return typeof value === "number" || typeof value === "boolean" ? String(value) : text(value);
}

// A canonical string (including an explicitly cleared value) overrides old fields.
function canonical(data: Record<string, unknown>, key: OptionalWordField, fallback?: string) {
  return typeof data[key] === "string" ? text(data[key]) : fallback;
}

export function readWordDetails(data: Record<string, unknown>) {
  const fields = record(data.fields);
  const inflections = inflectionKeys.map((key) => {
    const value = displayValue(fields[key]);
    return value ? `${legacyLabels[key]}: ${value}` : "";
  }).filter(Boolean).join("\n") || undefined;
  const consumed = new Set(["reading", "partOfSpeech", "inflections", "example", ...inflectionKeys]);
  const legacyDetails: WordDetail[] = Object.entries(fields).flatMap(([key, item]) => {
    const value = displayValue(item);
    return !consumed.has(key) && value ? [{ label: legacyLabels[key] ?? key, value }] : [];
  });
  return {
    reading: canonical(data, "reading", text(fields.reading) ?? text(data.yomigana)),
    partOfSpeech: canonical(data, "partOfSpeech", text(data.part) ?? text(fields.partOfSpeech)),
    inflections: canonical(data, "inflections", text(fields.inflections) ?? inflections),
    example: canonical(data, "example", text(fields.example)),
    legacyDetails,
  };
}

export function getWordDetails(word: Partial<Record<OptionalWordField, string>> & { legacyDetails?: WordDetail[] }): WordDetail[] {
  return [
    ...optionalWordFields.flatMap(({ key, label }) => word[key]?.trim() ? [{ label, value: word[key]!.trim() }] : []),
    ...(word.legacyDetails ?? []),
  ];
}

export function normalizeWordValues(values: WordValues): Required<WordValues> {
  const word = values.word.trim();
  const meaning = values.meaning.trim();
  if (!word || !meaning) throw new Error("단어와 뜻을 모두 입력해 주세요.");
  return {
    word, meaning,
    reading: values.reading?.trim() ?? "",
    partOfSpeech: values.partOfSpeech?.trim() ?? "",
    inflections: values.inflections?.trim() ?? "",
    example: values.example?.trim() ?? "",
  };
}
