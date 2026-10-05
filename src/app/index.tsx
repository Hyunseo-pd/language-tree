import { Link, type Href } from "expo-router";

import { NavButton } from "@/components/NavButton";
import { ScreenShell } from "@/components/ScreenShell";

export default function WordListScreen() {
  return (
    <ScreenShell title="단어 리스트">
      <Link href={"/sample" as Href} asChild>
        <NavButton label="단어 카드" />
      </Link>
      <Link href="/languagesList" asChild>
        <NavButton label="언어 리스트" />
      </Link>
    </ScreenShell>
  );
}
