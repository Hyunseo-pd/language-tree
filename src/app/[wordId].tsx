import { Image } from "expo-image";
import { useFonts } from "expo-font";
import { WordnoteColors as palette, WordnoteIcons } from "@/constants/wordnote";
import { Link, useLocalSearchParams, type Href } from "expo-router";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { subscribeToWords, type WordItem } from "@/lib/languageStore";
import { getWordDetails } from "@/lib/wordFields";
import { selectWordSort, sortWords, useWordSort, type WordSortOrder } from "@/lib/wordSort";

export default function WordCardScreen() {
  const [fontsLoaded, fontError] = useFonts({ Inter: require("../../assets/fonts/Inter/Inter.ttf") });
  const { wordId, languageId } = useLocalSearchParams<{
    wordId?: string;
    languageId?: string;
  }>();
  const [firebaseWords, setFirebaseWords] = useState<WordItem[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(languageId));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const routeKey = JSON.stringify([languageId, wordId]);
  const [selection, setSelection] = useState({ routeKey, id: wordId });
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);
  const [transition, setTransition] = useState<{ direction: number; sequence: number } | null>(null);
  const slideX = useSharedValue(0);
  const cardWidth = useSharedValue(360);
  const transitioning = useSharedValue(false);

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));

  useLayoutEffect(() => {
    if (!transition) return;
    // The incoming preview is already centered. Rebase after the new word renders.
    slideX.set(0);
    transitioning.set(false);
  }, [transition, slideX, cardWidth, transitioning]);

  function completeSwipe(direction: number) {
    setShowMeaning(false);
    const target = direction < 0 ? nextWord : previousWord;
    if (target) setSelection({ routeKey, id: target.id });
    setTransition((previous) => ({ direction, sequence: (previous?.sequence ?? 0) + 1 }));
  }

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

  const sort = useWordSort(languageId);
  const words = useMemo(() => sortWords(firebaseWords, sort), [firebaseWords, sort]);

  const selectedIndex = Math.max(
    0,
    words.findIndex((word) => word.id === (selection.routeKey === routeKey ? selection.id : wordId)),
  );
  const index = selectedIndex;
  const currentWord = words[index];
  const previousWord = words.length ? words[(index - 1 + words.length) % words.length] : undefined;
  const nextWord = words.length ? words[(index + 1) % words.length] : undefined;
  const previousStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value - (cardWidth.value + 16) }],
  }));
  const nextStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value + cardWidth.value + 16 }],
  }));

  function showPrevious() {
    if (words.length === 0) {
      return;
    }

    setShowMeaning(false);
    if (previousWord) setSelection({ routeKey, id: previousWord.id });
  }

  function showNext() {
    if (words.length === 0) {
      return;
    }

    setShowMeaning(false);
    if (nextWord) setSelection({ routeKey, id: nextWord.id });
  }

  function changeSort(order: WordSortOrder) {
    if (!languageId || transitioning.get()) return;
    // Anchor the visible word before publishing the new shared order.
    if (currentWord) setSelection({ routeKey, id: currentWord.id });
    selectWordSort(languageId, order, firebaseWords);
    setSortMenuOpen(false);
  }

  const canInteract = Boolean(currentWord) && !isLoading && !errorMessage;
  const swipeGesture = Gesture.Pan()
    .enabled(canInteract && !sortMenuOpen)
    .activeOffsetX([-16, 16])
    .failOffsetY([-24, 24])
    .maxPointers(1)
    .onUpdate((event) => {
      if (!transitioning.value) {
        const limit = cardWidth.value + 16;
        slideX.set(Math.max(-limit, Math.min(limit, event.translationX)));
      }
    })
    .onEnd((event) => {
      if (transitioning.value) return;
      const distance = Math.abs(event.translationX);
      const horizontal = distance > Math.abs(event.translationY);
      const committed = horizontal && (distance >= Math.min(96, cardWidth.value * 0.25)
        || (distance >= 24 && Math.abs(event.velocityX) >= 700
          && event.translationX * event.velocityX > 0));
      if (!committed) {
        slideX.set(withTiming(0, { duration: 180 }));
        return;
      }
      const direction = event.translationX < 0 ? -1 : 1;
      transitioning.set(true);
      slideX.set(withTiming(direction * (cardWidth.get() + 16), { duration: 160 }, (finished) => {
        if (finished) runOnJS(completeSwipe)(direction);
        else transitioning.set(false);
      }));
    })
    .onFinalize((_event, success) => {
      if (!success && !transitioning.value) slideX.set(withTiming(0, { duration: 180 }));
    });
  const tapGesture = Gesture.Tap()
    .enabled(canInteract && !sortMenuOpen)
    .maxDistance(12)
    .runOnJS(true)
    .onEnd((_event, success) => {
      if (success && !transitioning.value) setShowMeaning((previous) => !previous);
    });

  return (
    <SafeAreaView style={[styles.safeArea, !fontsLoaded && !fontError && { opacity: 0 }]}>
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
              <Image source={WordnoteIcons.back} style={styles.icon} contentFit="contain" />
            </Pressable>
          </Link>

          <Text style={styles.counter}>
            {words.length === 0 ? 0 : index + 1}/{words.length}
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={"\uC815\uB82C"}
            accessibilityState={{ expanded: sortMenuOpen }}
            disabled={!canInteract}
            style={styles.sortButton}
            onPress={() => {
              if (!transitioning.get()) setSortMenuOpen((open) => !open);
            }}
          >
            <Text style={styles.sortLabel}>정렬</Text>
            <Image source={WordnoteIcons.sort} style={[styles.icon, sortMenuOpen && { transform: [{ rotate: "180deg" }] }]} contentFit="contain" />
          </Pressable>
        </View>

        {sortMenuOpen ? (
          <>
            <Pressable style={styles.menuBackdrop} accessibilityRole="button"
              accessibilityLabel={"\uC815\uB82C \uBA54\uB274 \uB2EB\uAE30"}
              onPress={() => setSortMenuOpen(false)} />
            <View style={styles.sortMenu}>
              {([
                { value: "alphabetical", label: "\uC54C\uD30C\uBCB3\uC21C" },
                { value: "date", label: "\uB0A0\uC9DC\uC21C (\uCD5C\uC2E0\uC21C)" },
                { value: "random", label: "\uB79C\uB364" },
              ] as const).map((option) => (
                <Pressable key={option.value} accessibilityRole="button"
                  accessibilityState={{ selected: sort.order === option.value }}
                  onPress={() => changeSort(option.value)}
                  style={[styles.sortOption, sort.order === option.value && styles.sortOptionSelected]}>
                  <Text style={[styles.editLabel, sort.order === option.value && styles.sortOptionLabelSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        <GestureDetector gesture={Gesture.Exclusive(swipeGesture, tapGesture)}>
        <View style={styles.cardViewport} onLayout={(event) => { cardWidth.set(event.nativeEvent.layout.width - 24); }}>
        {canInteract && previousWord && nextWord ? (
          <>
            <Animated.View style={[styles.card, styles.previewCard, previousStyle]} pointerEvents="none"
              accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Text style={styles.word}>{previousWord.word}</Text>
              <Text style={styles.hint}>{"터치해서 뒤집기"}</Text>
            </Animated.View>
            <Animated.View style={[styles.card, styles.previewCard, nextStyle]} pointerEvents="none"
              accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Text style={styles.word}>{nextWord.word}</Text>
              <Text style={styles.hint}>{"터치해서 뒤집기"}</Text>
            </Animated.View>
          </>
        ) : null}
        <Animated.View
          style={[styles.card, slideStyle]}
          accessible
          accessibilityLabel={currentWord ? (showMeaning ? [currentWord.word, currentWord.meaning, ...getWordDetails(currentWord).map(({ label, value }) => `${label}: ${value}`)].join(". ") : currentWord.word) : "No word"}
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

        </Animated.View>
        </View>
        </GestureDetector>

        <View style={styles.footer}>
          <Pressable accessibilityRole="button" accessibilityLabel="이전 단어" disabled={!canInteract} style={styles.iconButton} onPress={() => { if (!transitioning.get()) showPrevious(); }}>
            <Image source={WordnoteIcons.previous} style={styles.icon} contentFit="contain" />
          </Pressable>
            <Link
              href={
                {
                  pathname: "/[wordId]/edit",
                  params: { wordId: currentWord?.id ?? wordId, languageId },
                } as Href
              }
              asChild
            >
              <Pressable accessibilityRole="button" accessibilityLabel="단어 편집" disabled={!canInteract} style={styles.iconButton}><Image source={WordnoteIcons.edit} style={styles.icon} contentFit="contain" /></Pressable>
            </Link>
          <Pressable accessibilityRole="button" accessibilityLabel="다음 단어" disabled={!canInteract} style={styles.iconButton} onPress={() => { if (!transitioning.get()) showNext(); }}>
            <Image source={WordnoteIcons.next} style={styles.icon} contentFit="contain" />
          </Pressable>
        </View>
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
    <View style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[styles.cardFace, frontStyle]} pointerEvents={showMeaning ? "none" : "auto"}>
        <Text style={styles.word}>{word.word}</Text>
        <Text style={styles.hint}>터치해서 뒤집기</Text>
      </Animated.View>
      <Animated.View style={[styles.cardFace, backStyle]} pointerEvents={showMeaning ? "auto" : "none"}>
        <ScrollView style={styles.detailScroll} contentContainerStyle={styles.details} nestedScrollEnabled>
          <Text style={styles.backWord}>{word.word}</Text>
          <Text style={styles.meaning}>{word.meaning}</Text>
          {getWordDetails(word).map(({ label, value }) => (
            <View key={label} style={styles.detail}>
              <Text style={styles.detailLabel}>{label}</Text>
              <Text style={styles.detailValue}>{value}</Text>
            </View>
          ))}
          <Text style={styles.hint}>터치해서 단어 보기</Text>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.background },
  screen: { flex: 1, paddingHorizontal: 21, paddingBottom: 34 },
  header: { height: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  icon: { width: 48, height: 48 },
  iconButton: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  sortButton: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: palette.secondary, borderRadius: 5 },
  sortLabel: { width: 48, textAlign: "center", fontFamily: "Inter", fontSize: 16, color: palette.text },
  counter: { position: "absolute", left: 48, right: 48, textAlign: "center", fontFamily: "Inter", fontSize: 20, lineHeight: 24, color: palette.text },
  menuBackdrop: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 10 },
  sortMenu: { position: "absolute", top: 56, right: 21, zIndex: 11, width: 200, padding: 8, gap: 4, backgroundColor: palette.background, borderRadius: 5, borderWidth: 1, borderColor: palette.secondary },
  sortOption: { minHeight: 48, justifyContent: "center", paddingHorizontal: 16, borderRadius: 5 },
  sortOptionSelected: { backgroundColor: palette.icon },
  editLabel: { color: palette.text, fontFamily: "Inter", fontSize: 15 },
  sortOptionLabelSelected: { color: palette.background },
  cardViewport: { flex: 1, marginTop: 4, marginHorizontal: -12, paddingHorizontal: 12, overflow: "hidden" },
  card: { flex: 1, position: "relative", alignItems: "center", justifyContent: "center", backgroundColor: palette.background, borderColor: palette.secondary, borderWidth: 1, borderRadius: 5, boxShadow: "2px 2px 12px rgba(0, 0, 0, 0.12)" },
  previewCard: { position: "absolute", top: 0, bottom: 0, left: 12, right: 12 },
  cardFace: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center", borderRadius: 5, backgroundColor: palette.background, backfaceVisibility: "hidden" },
  word: { color: palette.text, fontFamily: "Inter", fontSize: 45, fontWeight: "700", lineHeight: 54, paddingHorizontal: 13, textAlign: "center" },
  hint: { marginTop: 16, fontFamily: "Inter", fontSize: 20, lineHeight: 24, color: palette.secondary, textAlign: "center" },
  detailScroll: { flex: 1, width: "100%", borderRadius: 5 },
  details: { flexGrow: 1, justifyContent: "center", padding: 24, gap: 20 },
  backWord: { fontFamily: "Inter", fontSize: 22, fontWeight: "600", color: palette.secondary, textAlign: "center" },
  meaning: { fontSize: 30, fontWeight: "700", color: palette.text, textAlign: "center", lineHeight: 42 },
  detail: { gap: 6, borderTopWidth: 1, borderTopColor: palette.secondary, paddingTop: 16 },
  detailLabel: { color: palette.secondary, fontSize: 14, fontWeight: "600" },
  detailValue: { color: palette.icon, fontSize: 18, lineHeight: 28 },
  footer: { height: 48, marginTop: 4, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  centerState: { alignItems: "center", gap: 10 },
  errorText: { color: "#b00020", fontSize: 14, lineHeight: 20, paddingHorizontal: 24, textAlign: "center" },
  stateText: { color: palette.icon, fontSize: 15, lineHeight: 22, textAlign: "center" },
});
