import { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Fonts, FontSizes, Palette as palette } from "@/constants/theme";
import type { WordItem } from "@/lib/languageStore";
import { getWordDetails } from "@/lib/wordFields";

export function FlipCard({ word, showMeaning, hideExample = false }: { word: WordItem; showMeaning: boolean; hideExample?: boolean }) {
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
          {getWordDetails(hideExample ? { ...word, example: undefined } : word).map(({ label, value }) => (
            <View key={label} style={styles.detail}>
              <Text style={styles.detailLabel}>{label}</Text>
              <Text style={styles.detailValue}>{value}</Text>
            </View>
          ))}
          <Text style={styles.hint}>터치해서 뒤집기</Text>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardFace: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: palette.background, backfaceVisibility: "hidden" , borderColor: palette.gray50, borderWidth: 1,  boxShadow: "2px 2px 4px rgba(0, 0, 0, 0.1)"},
  word: { color: palette.text, fontFamily: Fonts.word, fontSize: FontSizes.hero, fontWeight: "800", lineHeight: 54, paddingHorizontal: 13, textAlign: "center" },
  hint: { marginTop: 16, fontFamily: Fonts.sans, fontSize: FontSizes.body, lineHeight: 24, color: palette.gray50, textAlign: "center" },
  detailScroll: { flex: 1, width: "100%", borderRadius: 10 },
  details: { flexGrow: 1, justifyContent: "center", padding: 24, gap: 20 },
  backWord: { fontFamily: Fonts.word, fontSize: FontSizes.wordLabel, fontWeight: "600", color: palette.gray50, textAlign: "center" },
  meaning: { fontFamily: Fonts.sans, fontSize: FontSizes.meaning, fontWeight: "700", color: palette.text, textAlign: "center", lineHeight: 42 },
  detail: { gap: 6, borderTopWidth: 1, borderTopColor: palette.gray50, paddingTop: 16 },
  detailLabel: { color: palette.gray50, fontFamily: Fonts.sans, fontSize: FontSizes.small, fontWeight: "600" },
  detailValue: { color: palette.gray70, fontFamily: Fonts.sans, fontSize: FontSizes.detail, lineHeight: 28 },
});
