import { Link, router, useFocusEffect, useLocalSearchParams, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { NavButton } from "@/components/NavButton";
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
    setSortMenuOpen(false);
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="단어 정렬"
          accessibilityState={{ expanded: sortMenuOpen }}
          style={styles.headerButton}
          onPress={() => setSortMenuOpen((open) => !open)}
        >
          <Text style={styles.headerLabel}>{sortMenuOpen ? "정렬 ▴" : "정렬 ▾"}</Text>
        </Pressable>
      }
    >
      {sortMenuOpen ? <View style={styles.sortControls}>
        {([
          { value: "alphabetical", label: "알파벳순" },
          { value: "date", label: "날짜순 (최신순)" },
          { value: "random", label: "랜덤" },
        ] as const).map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: sort.order === option.value }}
            onPress={() => selectSort(option.value)}
            style={[styles.sortButton, sort.order === option.value && styles.sortButtonSelected]}
          >
            <Text style={[styles.sortLabel, sort.order === option.value && styles.sortLabelSelected]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View> : null}
      <Link push href={{ pathname: "/add-word", params: { languageId } } as Href} asChild>
        <NavButton label="＋ 단어 추가" />
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
    backgroundColor: "#eeeeee",
  },
  menuIcon: {
    gap: 5,
  },
  menuLine: {
    width: 22,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#111111",
  },
  headerButton: { minWidth: 48, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#f3f4f6" },
  headerLabel: { fontSize: 15, fontWeight: "600", color: "#17212f" },
  sortControls: {
    gap: 8,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
  },
  sortButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cccccc",
  },
  sortButtonSelected: {
    backgroundColor: "#111111",
    borderColor: "#111111",
  },
  sortLabel: {
    color: "#444444",
    fontSize: 14,
  },
  sortLabelSelected: {
    color: "#ffffff",
    fontWeight: "600",
  },
  centerState: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 24,
  },
  errorText: {
    color: "#b00020",
    fontSize: 14,
    lineHeight: 20,
  },
  stateText: {
    color: "#666666",
    fontSize: 15,
    lineHeight: 22,
  },
});
