import { Pressable, StyleSheet, Text } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";

import { ListButton } from "@/components/ui/ListButton";

type Props = {
  label: string;
  onPress: () => void;
  onEdit: () => void;
};

export function WordListItem({ label, onPress, onEdit }: Props) {
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
      <ListButton label={label} onPress={onPress}
        accessibilityHint="누르면 카드를 봅니다. 왼쪽으로 밀면 편집 버튼이 나타납니다."
        accessibilityActions={[{ name: "edit", label: "단어 편집" }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === "edit") onEdit();
        }} />
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  foreground: { backgroundColor: "#ffffff" },
  editButton: { width: 80, alignItems: "center", justifyContent: "center", backgroundColor: "#666666" },
  editLabel: { color: "#ffffff", fontSize: 13, fontWeight: "600" },
});
