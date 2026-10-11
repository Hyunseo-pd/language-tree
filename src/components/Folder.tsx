import { Pressable, PressableProps, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
type FolderProps = PressableProps & {
  label: string;
  wordCount?: number;
  onRename?: () => void;
  onDelete?: () => void;
};
 
export function Folder({ label, wordCount, style, onRename, onDelete, ...props }: FolderProps) {
   function renderActions() {
    return (
      <View style={styles.actions}>
        <Pressable
          style={[styles.actionButton, styles.rename]}
          onPress={onRename}
        >
          <Text style={styles.actionLabel}>이름 변경</Text>
        </Pressable>

        <Pressable
          style={[styles.actionButton, styles.delete]}
          onPress={onDelete}
        >
          <Text style={styles.actionLabel}>삭제</Text>
        </Pressable>
      </View>
    );
  }
  return (
     <GestureHandlerRootView style={{ flex: 1 }}>
    <ReanimatedSwipeable renderRightActions={renderActions}>
    <Pressable
      accessibilityRole="button"
      style={(state) => [
        styles.button,
        state.pressed && styles.pressed,
        typeof style === "function" ? style(state) : style,
      ]}
      {...props}
    >
      <Text style={styles.label}>{label}</Text>
      {wordCount !== undefined && (
        <Text style={styles.wordCount}>{wordCount}</Text>
      )}
    </Pressable>
    </ReanimatedSwipeable>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderColor: "#CCCCCC",
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 24,
  },
  pressed: {
    opacity: 0.72,
  },
  label: {
    color: "#111111",
    fontSize: 24,
    fontWeight: "600",
  },
  wordCount: {
    color: "#666666",
    fontSize: 14,
    fontWeight: "400",
  },
  actions: {
    flexDirection: "row",
  },
   actionButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 80,
  },
  rename: {
    backgroundColor: "#666666",
  },
  delete: {
    backgroundColor: "#D64545",
  },
  actionLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});
