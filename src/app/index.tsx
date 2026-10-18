import { Folder } from "@/components/Folder";
import { ScreenShell } from "@/components/ScreenShell";
import { getLanguages, type LanguageFolder } from "@/lib/languageStore";
import { Link, useFocusEffect, type Href } from "expo-router";
import { useCallback, useState } from "react";

export default function LanguagesHomeScreen() {
  const [languages, setLanguages] = useState<LanguageFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
 
  useFocusEffect(useCallback(() => {
    let isActive = true;
    setIsLoading(true);
    setErrorMessage(null);

    getLanguages()
      .then((nextLanguages) => {
        if (isActive) {
          setLanguages(nextLanguages);
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to load languages.");
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []));
  return (
    <ScreenShell title="언어 목록" subtitle={errorMessage ?? (isLoading ? "불러오는 중..." : "단어장을 선택하세요")}>
      {languages.map((language) => (
        <Link
          key={language.id}
          href={
            `/languages/${encodeURIComponent(language.id)}?languageName=${encodeURIComponent(
              language.name,
            )}` as Href
          }
          asChild
        >
          <Folder label={language.name}
          wordCount={language.wordCount}
          onRename={() => console.log("이름 변경")}
  onDelete={() => console.log("삭제")} />
        </Link>
      ))}
    </ScreenShell>
  );
}
