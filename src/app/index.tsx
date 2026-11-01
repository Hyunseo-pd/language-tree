import { FolderNameDialog } from "@/components/FolderNameDialog";
import { ListButton } from "@/components/ui/ListButton";
import { Folder } from "@/components/Folder";
import { ScreenShell } from "@/components/ScreenShell";
import { createLanguage, renameLanguage, getLanguages, getCachedLanguages, type LanguageFolder } from "@/lib/languageStore";
import { Link, useFocusEffect, type Href } from "expo-router";
import { useCallback, useState } from "react";

export default function LanguagesHomeScreen() {
  const [editor, setEditor] = useState<{ language?: LanguageFolder } | null>(null);
  const [languages, setLanguages] = useState<LanguageFolder[]>(() => getCachedLanguages() ?? []);
  const [isLoading, setIsLoading] = useState(() => !getCachedLanguages());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
 
  useFocusEffect(useCallback(() => {
    let isActive = true;
    const cached = getCachedLanguages();
    if (cached) setLanguages(cached);
    setIsLoading(!cached);
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
      <ListButton label="＋ 폴더 추가" disabled={isLoading} onPress={() => setEditor({})} />
      {languages.map((language) => (
        <Link
          push
          key={language.id}
          href={
            `/languages/${encodeURIComponent(language.id)}?languageName=${encodeURIComponent(
              language.name,
            )}` as Href
          }
          asChild
        >
          <Folder
            label={language.name}
            wordCount={language.wordCount}
            onRename={() => setEditor({ language })}
          />
        </Link>
      ))}
      {editor ? (
        <FolderNameDialog
          title={editor.language ? "폴더 이름 변경" : "폴더 추가"}
          initialName={editor.language?.name ?? ""}
          onClose={() => setEditor(null)}
          onSave={async (name) => {
            if (editor.language) {
              const id = editor.language.id;
              await renameLanguage(id, name);
              setLanguages((previous) => previous.map((item) => item.id === id ? { ...item, name } : item));
            } else {
              const language = await createLanguage(name);
              setLanguages((previous) => [...previous, language]);
            }
          }}
        />
      ) : null}
    </ScreenShell>
  );
}
