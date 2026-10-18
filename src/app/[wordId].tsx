import { Link, useLocalSearchParams, type Href } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { subscribeToWords, type WordItem } from "@/lib/languageStore";

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

  const words = firebaseWords;

  const selectedIndex = Math.max(
    0,
    words.findIndex((word) => word.id === wordId),
  );
  const index = words.length === 0 ? 0 : ((selectedIndex + indexOffset) % words.length + words.length) % words.length;
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

  const canInteract = Boolean(currentWord) && !isLoading && !errorMessage;
  const swipeGesture = Gesture.Pan()
    .enabled(canInteract)
    .activeOffsetX([-16, 16])
    .failOffsetY([-24, 24])
    .maxPointers(1)
    .runOnJS(true)
    .onEnd((event) => {
      if (Math.abs(event.translationX) < 48
        || Math.abs(event.translationX) <= Math.abs(event.translationY)) return;
      if (event.translationX < 0) showNext();
      else showPrevious();
    });
  const tapGesture = Gesture.Tap()
    .enabled(canInteract)
    .maxDistance(12)
    .runOnJS(true)
    .onEnd((_event, success) => {
      if (success) setShowMeaning((previous) => !previous);
    });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Link
            dismissTo
            href={
              languageId
                ? (`/languages/${encodeURIComponent(languageId)}` as Href)
                : "/"
            }
            asChild
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={"\uB2E8\uC5B4 \uBAA9\uB85D\uC73C\uB85C"}
              style={styles.iconButton}
            >
              <View style={styles.listIcon}>
                {[0, 1, 2].map((row) => (
                  <View key={row} style={styles.listIconRow}>
                    <View style={styles.listIconDot} />
                    <View style={styles.listIconLine} />
                  </View>
                ))}
              </View>
            </Pressable>
          </Link>

          <Text style={styles.counter}>
            {words.length === 0 ? 0 : index + 1}/{words.length}
          </Text>

          <View style={styles.headerActions}>
            <Link
              href={
                {
                  pathname: "/[wordId]/edit",
                  params: { wordId: currentWord?.id ?? wordId, languageId },
                } as Href
              }
              asChild
            >
              <Pressable accessibilityRole="button" accessibilityLabel={"\uB2E8\uC5B4 \uD3B8\uC9D1"} disabled={!currentWord} style={styles.editButton}><Text style={styles.editLabel}>{"\uD3B8\uC9D1"}</Text></Pressable>
            </Link>
          </View>
        </View>

        <GestureDetector gesture={Gesture.Exclusive(swipeGesture, tapGesture)}>
        <View
          style={styles.card}
          accessible
          accessibilityLabel={currentWord ? (showMeaning ? currentWord.meaning : currentWord.word) : "No word"}
          accessibilityHint="Tap anywhere to flip the word. Swipe left or right to change words."
          accessibilityActions={canInteract ? [
            { name: "activate", label: "Flip word" },
            { name: "increment", label: "Next word" },
            { name: "decrement", label: "Previous word" },
          ] : []}
          onAccessibilityAction={(event) => {
            if (!canInteract) return;
            if (event.nativeEvent.actionName === "activate") setShowMeaning((previous) => !previous);
            if (event.nativeEvent.actionName === "increment") showNext();
            if (event.nativeEvent.actionName === "decrement") showPrevious();
          }}
        >
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

          {currentWord && !isLoading && !errorMessage ? (
            <FlipCard key={currentWord.id} word={currentWord} showMeaning={showMeaning} />
          ) : null}

        </View>
        </GestureDetector>

        <View style={styles.footer} />
      </View>
    </SafeAreaView>
  );
}

function FlipCard({ word, showMeaning }: { word: WordItem; showMeaning: boolean }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withTiming(showMeaning ? 180 : 0, { duration: 320 });
  }, [showMeaning, rotation]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${rotation.value}deg` }],
    opacity: rotation.value > 90 ? 0 : 1,
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${rotation.value + 180}deg` }],
    opacity: rotation.value > 90 ? 1 : 0,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[styles.cardFace, frontStyle]}>
        <Text style={styles.word}>{word.word}</Text>
        <Text style={styles.hint}>Tap to see meaning</Text>
      </Animated.View>
      <Animated.View style={[styles.cardFace, backStyle]}>
        <Text style={styles.word}>{word.meaning}</Text>
        <Text style={styles.hint}>Tap to see word</Text>
      </Animated.View>
    </View>
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
  editButton: {
    minHeight: 44,
    minWidth: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#f1f3f5",
  },
  editLabel: {
    color: "#111111",
    fontSize: 15,
    fontWeight: "600",
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
  cardFace: {
    position: "absolute", top: 0, right: 0, bottom: 0, left: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#ffffff",
    backfaceVisibility: "hidden",
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
  footer: {
    alignItems: "center",
    flexDirection: "row",
    height: 78,
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  listIcon: {
    gap: 5,
  },
  listIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  listIconDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#111111",
  },
  listIconLine: {
    width: 19,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#111111",
  },
  iconButton: {
    alignItems: "center",
    height: 52,
    justifyContent: "center",
    minWidth: 52,
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
