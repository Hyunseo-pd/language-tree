import { Link, useLocalSearchParams, type Href } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { NavButton } from "@/components/NavButton";
import { ScreenShell } from "@/components/ScreenShell";
import { subscribeToWords, type WordItem } from "@/lib/languageStore";

export default function LanguageWordsScreen() {
  const { languageId, languageName } = useLocalSearchParams<{
    languageId: string;
    languageName?: string;
  }>();
  const [sortOrder, setSortOrder] = useState<"alphabetical" | "date">("alphabetical");
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

  const sortedWords = useMemo(() => [...words].sort((a, b) => {
    if (sortOrder === "date") {
      const aDate = a.savedAt ?? a.createdAt;
      const bDate = b.savedAt ?? b.createdAt;
      if (aDate === undefined && bDate !== undefined) return 1;
      if (aDate !== undefined && bDate === undefined) return -1;
      if (aDate !== undefined && bDate !== undefined && aDate !== bDate) {
        return bDate - aDate;
      }
    }

    return a.word.localeCompare(b.word, undefined, { sensitivity: "base" })
      || a.id.localeCompare(b.id);
  }), [words, sortOrder]);

  const title = languageName ?? languageId;

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
    >
      <View style={styles.sortControls}>
        {([
          { value: "alphabetical", label: "알파벳순" },
          { value: "date", label: "날짜순 (최신순)" },
        ] as const).map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: sortOrder === option.value }}
            onPress={() => setSortOrder(option.value)}
            style={[styles.sortButton, sortOrder === option.value && styles.sortButtonSelected]}
          >
            <Text style={[styles.sortLabel, sortOrder === option.value && styles.sortLabelSelected]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
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
        <Link
          push
          key={word.id}
          href={
            {
              pathname: "/[wordId]",
              params: { wordId: word.id, languageId },
            } as Href
          }
          asChild
        >
          <NavButton label={word.meaning ? `${word.word} - ${word.meaning}` : word.word} />
        </Link>
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
  sortControls: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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
