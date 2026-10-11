import { Folder } from "@/components/Folder";
import { ScreenShell } from "@/components/ScreenShell";
import { subscribeToLanguages, type LanguageFolder } from "@/lib/languageStore";
import { Link, useLocalSearchParams, type Href } from "expo-router";
import { useEffect, useState } from "react";

const languages: LanguageFolder[] = [];

export default function LanguagesHomeScreen() {
  const { languageId, languageName } = useLocalSearchParams<{
      languageId: string;
      languageName?: string;
    }>();
  const [languages, setLanguages] = useState<LanguageFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
 
  useEffect(() => {
    const unsubscribe = subscribeToLanguages(
      (nextLanguages) => {
        setLanguages(nextLanguages);
        setIsLoading(false);
        setErrorMessage(null);
      },
      (error) => {
        setErrorMessage(error.message);
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, [languageId]);
  return (
    <ScreenShell title="언어 목록" subtitle="단어장을 선택하세요">
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
          wordCount={24}
          onRename={() => console.log("이름 변경")}
  onDelete={() => console.log("삭제")} />
        </Link>
      ))}
    </ScreenShell>
  );
}
