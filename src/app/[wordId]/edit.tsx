import { Link, useLocalSearchParams, type Href } from "expo-router";

import { NavButton } from "@/components/NavButton";
import { ScreenShell } from "@/components/ScreenShell";

export default function WordEditScreen() {
  const { wordId } = useLocalSearchParams<{ wordId: string }>();

  return (
    <ScreenShell title="단어 편집" subtitle={wordId}>
      <Link href={`/${wordId}` as Href} asChild>
        <NavButton label="단어 카드" />
      </Link>
      <Link href="/" asChild>
        <NavButton label="단어 리스트" />
      </Link>
    </ScreenShell>
  );
}
