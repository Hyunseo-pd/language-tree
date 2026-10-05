import { Link } from "expo-router";

import { NavButton } from "@/components/NavButton";
import { ScreenShell } from "@/components/ScreenShell";

export default function LanguagesListScreen() {
  return (
    <ScreenShell title="언어 리스트">
      <Link href="/" asChild>
        <NavButton label="단어 리스트" />
      </Link>
    </ScreenShell>
  );
}
