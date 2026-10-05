import { Link, useLocalSearchParams, type Href } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View, type PressableProps, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WordCardScreen() {
  const sampleWords = [
  { id: "1", word: "streben", meaning: "노력하다, 추구하다" },
  { id: "2", word: "lernen", meaning: "배우다" },
  { id: "3", word: "wachsen", meaning: "자라다" },
];
  const [index, setIndex] = useState(0);
  const currentWord = sampleWords[index];

  function showPrevious() {
  setIndex((prev) => (prev - 1 + sampleWords.length) % sampleWords.length);
}

function showNext() {
  setIndex((prev) => (prev + 1) % sampleWords.length);
}
  const { wordId } = useLocalSearchParams<{ wordId: string }>();
  const word = wordId === "sample" ? "streben" : wordId;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Link href="/" asChild>
            <IconButton label="단어 리스트" icon="☷" />
          </Link>

          <Text style={styles.counter}>{index + 1}/{sampleWords.length}</Text>

          <View style={styles.headerActions}>
            <IconButton label="삭제" icon="⌫" />
            <Link href={`/${wordId}/edit` as Href} asChild>
              <IconButton label="단어 편집" icon="✎" />
            </Link>
          </View>
        </View>

        <View style={styles.card}>
         <IconButton
  label="이전 단어"
  icon="‹"
  style={styles.cardArrowLeft}
  onPress={showPrevious}
/>
          <Text style={styles.word}>{currentWord.word}</Text>
          <IconButton
  label="다음 단어"
  icon="›"
  style={styles.cardArrowRight}
  onPress={showNext}
/>

          <Pressable accessibilityRole="button" style={styles.exampleButton}>
            <Text style={styles.exampleText}>예문 생성하기</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <IconButton label="이전" icon="‹" />
          <IconButton label="즐겨찾기" icon="☆" />
          <View style={styles.sortGroup}>
            <IconButton label="정렬 방식" icon="≡" />
            <Text style={styles.sortText}>정렬</Text>
          </View>
          <IconButton label="다음" icon="›" />
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
});
