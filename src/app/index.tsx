import { Link, type Href } from "expo-router";

import { NavButton } from "@/components/NavButton";
import { ScreenShell } from "@/components/ScreenShell";

const languages = [
  { id: "germanwords", name: "German" },
  { id: "japanesewords", name: "Japanese" },
];

export default function LanguagesHomeScreen() {
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
          <NavButton label={language.name} />
        </Link>
      ))}
    </ScreenShell>
  );
}
