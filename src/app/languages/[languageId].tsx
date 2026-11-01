import { Palette, Fonts, FontSizes } from "@/constants/theme";
import { WordSortDropdown } from "@/components/WordSortDropdown";
import { Link, router, useFocusEffect, useLocalSearchParams, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { ListButton } from "@/components/ui/ListButton";
import { ScreenShell } from "@/components/ScreenShell";
import { WordListItem } from "@/components/WordListItem";
import { getLanguageName, subscribeToWords, type WordItem } from "@/lib/languageStore";
import { selectWordSort, sortWords, useWordSort, type WordSortOrder } from "@/lib/wordSort";

export default function LanguageWordsScreen() {
  const { languageId, languageName } = useLocalSearchParams<{
    languageId: string;
    languageName?: string;
  }>();
  const [language, setLanguage] = useState<{ id: string; name: string } | null>(null);
  const sort = useWordSort(languageId);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [words, setWords] = useState<WordItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToWords(
      languageId,
      (nextWords) => {
        setWords(nextWords);
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

  function selectSort(order: WordSortOrder) {
    selectWordSort(languageId, order, words);
  }

  const sortedWords = useMemo(() => sortWords(words, sort), [words, sort]);

  useFocusEffect(useCallback(() => {
    let isActive = true;

    getLanguageName(languageId)
      .then((name) => {
        if (isActive) {
          setLanguage({ id: languageId, name: name ?? "단어 목록" });
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to load language name.");
        }
      });

    return () => {
      isActive = false;
    };
  }, [languageId]));

  const title = (language?.id === languageId ? language.name : undefined)
    ?? languageName ?? "단어 목록";

  return (
    <ScreenShell
      title={title}
      headerLeft={
        <Link href="/" dismissTo asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="언어 목록 메뉴"
            style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
          >
            <View style={styles.menuIcon}>
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
            </View>
          </Pressable>
        </Link>
      }
      headerRight={
        <WordSortDropdown value={sort.order} onChange={selectSort}
          open={sortMenuOpen} onOpenChange={setSortMenuOpen} />
      }
    >
      <Link push href={{ pathname: "/add-word", params: { languageId } } as Href} asChild>
        <ListButton label="＋ 단어 추가" />
      </Link>
      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator />
          <Text style={styles.stateText}>Loading list...</Text>
        </View>
      ) : null}

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      {!isLoading && !errorMessage && words.length === 0 ? (
        <Text style={styles.stateText}>No items found in this language.</Text>
      ) : null}

      {sortedWords.map((word) => (
        <WordListItem
          key={word.id}
          label={word.word}
          onPress={() => router.push({
            pathname: "/[wordId]",
            params: { wordId: word.id, languageId },
          } as Href)}
          onEdit={() => router.push({
            pathname: "/[wordId]/edit",
            params: { wordId: word.id, languageId },
          } as Href)}
        />
      ))}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  menuButtonPressed: {
    backgroundColor: Palette.surfacePressed,
  },
  menuIcon: {
    gap: 5,
  },
  menuLine: {
    width: 22,
    height: 2,
    borderRadius: 1,
    backgroundColor: Palette.textStrong,
  },
  centerState: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 24,
  },
  errorText: {
    color: Palette.error,
    fontFamily: Fonts.sans, fontSize: FontSizes.small,
    lineHeight: 20,
  },
  stateText: {
    color: Palette.textMuted,
    fontFamily: Fonts.sans, fontSize: FontSizes.label,
    lineHeight: 22,
  },
});
