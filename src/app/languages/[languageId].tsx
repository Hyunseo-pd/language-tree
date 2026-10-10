import { Link, useLocalSearchParams, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { NavButton } from "@/components/NavButton";
import { ScreenShell } from "@/components/ScreenShell";
import { subscribeToWords, type WordItem } from "@/lib/languageStore";

export default function LanguageWordsScreen() {
  const { languageId, languageName } = useLocalSearchParams<{
    languageId: string;
    languageName?: string;
  }>();
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

  const title = languageName ?? languageId;

  return (
    <ScreenShell title={title} subtitle="List">
       <Link href="/" asChild>
        <NavButton label="언어목록" />
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

      {words.map((word) => (
        <Link
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

      <Link href="/" asChild>
        <NavButton label="언어목록" />
      </Link>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
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
