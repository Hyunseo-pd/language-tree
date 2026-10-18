import { NavButton } from "@/components/NavButton";
import { ScreenShell } from "@/components/ScreenShell";
import { Link, useLocalSearchParams, type Href } from "expo-router";

export default function WordEditScreen() {
  const { wordId, languageId } = useLocalSearchParams<{ wordId: string; languageId: string }>();

  return (
    <ScreenShell title="단어 편집" subtitle={wordId}>
      <Link
        dismissTo
        href={
          {
            pathname: "/[wordId]",
            params: { wordId, languageId },
          } as Href
        }
        asChild
      >
        <NavButton label="단어 카드" />
      </Link>
      <Link
        dismissTo
        href={
          languageId
            ? (`/languages/${encodeURIComponent(languageId)}` as Href)
            : "/"
        }
        asChild
      >
        <NavButton label="단어 리스트" />
      </Link>
    </ScreenShell>
  );
}
