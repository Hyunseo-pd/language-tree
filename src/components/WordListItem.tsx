import { Fonts, FontSizes, Palette, Spacing } from "@/constants/theme";
import { Pressable, StyleSheet, Text } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";

type Props = {
  label: string;
  meaning?: string;
  showMeaning?: boolean;
  onPress: () => void;
  onEdit: () => void;
};

export function WordListItem({ label, meaning, showMeaning = true, onPress, onEdit }: Props) {
  return (
    <ReanimatedSwipeable
      friction={1}
      rightThreshold={48}
      dragOffsetFromRight={-16}
      overshootLeft={false}
      overshootRight={false}
      childrenContainerStyle={styles.foreground}
      renderRightActions={(_progress, _translation, swipeable) => (
        <Pressable accessibilityRole="button" accessibilityLabel={`${label} 편집`}
          style={styles.editButton} onPress={() => { swipeable.close(); onEdit(); }}>
          <Text style={styles.editLabel}>편집</Text>
        </Pressable>
      )}
    >
      <Pressable accessibilityRole="button" onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        accessibilityHint="누르면 카드를 봅니다. 왼쪽으로 밀면 편집 버튼이 나타납니다."
        accessibilityActions={[{ name: "edit", label: "단어 편집" }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === "edit") onEdit();
        }}>
        <Text style={styles.word}>{label}</Text>
        {showMeaning && meaning ? <Text style={styles.meaning} numberOfLines={2}>{meaning}</Text> : null}
      </Pressable>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  foreground: { backgroundColor: Palette.background },
  row: { backgroundColor: Palette.background, minHeight: 48, paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two, flexDirection: "row", alignItems: "center", gap: Spacing.three,
    borderBottomWidth: 1, borderColor: Palette.borderSubtle },
  pressed: { backgroundColor: Palette.surfacePressed },
  word: { flex: 1, color: Palette.textStrong, fontFamily: Fonts.sans, fontSize: FontSizes.title, fontWeight: "400" },
  meaning: { flex: 1, textAlign: "right", color: Palette.textMuted, fontFamily: Fonts.sans, fontSize: FontSizes.body, lineHeight: 22 },
  editButton: { width: 60, alignItems: "center", justifyContent: "center", backgroundColor: Palette.textMuted },
  editLabel: { color: Palette.white, fontFamily: Fonts.sans, fontSize: FontSizes.helper, fontWeight: "600" },
});
