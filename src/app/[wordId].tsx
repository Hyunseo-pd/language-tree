import { Link, useLocalSearchParams, type Href } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { subscribeToWords, type WordItem } from "@/lib/languageStore";

const sampleWords: WordItem[] = [
  { id: "1", word: "streben", meaning: "to strive, to pursue" },
  { id: "2", word: "lernen", meaning: "to learn" },
  { id: "3", word: "wachsen", meaning: "to grow" },
];

export default function WordCardScreen() {
  const { wordId, languageId } = useLocalSearchParams<{
    wordId?: string;
    languageId?: string;
  }>();
  const [firebaseWords, setFirebaseWords] = useState<WordItem[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(languageId));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [indexOffset, setIndexOffset] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);

  useEffect(() => {
    if (!languageId) {
      return;
    }

    const unsubscribe = subscribeToWords(
      languageId,
      (nextWords) => {
        setFirebaseWords(nextWords);
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

  const words = useMemo(
    () => (languageId ? firebaseWords : sampleWords),
    [firebaseWords, languageId],
  );

  const selectedIndex = Math.max(
    0,
    words.findIndex((word) => word.id === wordId),
  );
  const index = words.length === 0 ? 0 : (selectedIndex + indexOffset + words.length) % words.length;
  const currentWord = words[index];

  function showPrevious() {
    if (words.length === 0) {
      return;
    }

    setShowMeaning(false);
    setIndexOffset((prev) => prev - 1);
  }

  function showNext() {
    if (words.length === 0) {
      return;
    }

    setShowMeaning(false);
    setIndexOffset((prev) => prev + 1);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Link
            href={
              languageId
                ? (`/languages/${encodeURIComponent(languageId)}` as Href)
                : "/"
            }
            asChild
          >
            <IconButton label="Back to list" icon="<" />
          </Link>

          <Text style={styles.counter}>
            {words.length === 0 ? 0 : index + 1}/{words.length}
          </Text>

          <View style={styles.headerActions}>
            <IconButton label="Delete word" icon="-" />
            <Link href={`/${wordId}/edit` as Href} asChild>
              <IconButton label="Edit word" icon="+" />
            </Link>
          </View>
        </View>

        <View style={styles.card}>
          <IconButton
            label="Previous word"
            icon="<"
            style={styles.cardArrowLeft}
            onPress={showPrevious}
          />

          {isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator />
              <Text style={styles.stateText}>Loading list...</Text>
            </View>
          ) : null}

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          {!isLoading && !errorMessage && !currentWord ? (
            <Text style={styles.stateText}>No items found.</Text>
          ) : null}

          {currentWord ? (
            <Pressable onPress={() => setShowMeaning((prev) => !prev)}>
              <Text style={styles.word}>{showMeaning ? currentWord.meaning : currentWord.word}</Text>
              <Text style={styles.hint}>{showMeaning ? "Tap to see word" : "Tap to see meaning"}</Text>
            </Pressable>
          ) : null}

          <IconButton
            label="Next word"
            icon=">"
            style={styles.cardArrowRight}
            onPress={showNext}
          />

          <Pressable accessibilityRole="button" style={styles.exampleButton}>
            <Text style={styles.exampleText}>Generate example</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <IconButton label="Previous" icon="<" onPress={showPrevious} />
          <IconButton label="Favorite" icon="*" />
          <View style={styles.sortGroup}>
            <IconButton label="Sort" icon="=" />
            <Text style={styles.sortText}>Sort</Text>
          </View>
          <IconButton label="Next" icon=">" onPress={showNext} />
        </View>
      </View>
    </SafeAreaView>
  );
}

type IconButtonProps = PressableProps & {
  icon: string;
  label: string;
  style?: ViewStyle;
};

function IconButton({ icon, label, style, ...props }: IconButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      style={[styles.iconButton, style]}
      {...props}
    >
      <Text style={styles.icon}>{icon}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  screen: {
    flex: 1,
    paddingBottom: 28,
    paddingHorizontal: 22,
    paddingTop: 18,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    height: 58,
    justifyContent: "space-between",
  },
  headerActions: {
    flexDirection: "row",
    gap: 18,
  },
  counter: {
    color: "#000000",
    fontSize: 32,
    fontWeight: "400",
  },
  card: {
    alignItems: "center",
    borderColor: "#8f8f8f",
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    marginTop: 14,
    position: "relative",
  },
  cardArrowLeft: {
    left: 8,
    position: "absolute",
  },
  cardArrowRight: {
    position: "absolute",
    right: 8,
  },
  word: {
    color: "#000000",
    fontSize: 40,
    fontWeight: "800",
    lineHeight: 66,
    paddingHorizontal: 44,
    textAlign: "center",
  },
  hint: {
    marginTop: 16,
    fontSize: 14,
    color: "#888888",
    textAlign: "center",
  },
  exampleButton: {
    marginTop: 210,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  exampleText: {
    color: "#00a950",
    fontSize: 24,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    height: 78,
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  sortGroup: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  sortText: {
    color: "#000000",
    fontSize: 28,
    fontWeight: "500",
  },
  iconButton: {
    alignItems: "center",
    height: 52,
    justifyContent: "center",
    minWidth: 52,
  },
  icon: {
    color: "#000000",
    fontSize: 48,
    fontWeight: "700",
    lineHeight: 52,
  },
  centerState: {
    alignItems: "center",
    gap: 10,
  },
  errorText: {
    color: "#b00020",
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 24,
    textAlign: "center",
  },
  stateText: {
    color: "#666666",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
});
