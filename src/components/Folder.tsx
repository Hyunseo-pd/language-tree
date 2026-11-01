import { Palette, Fonts, FontSizes } from "@/constants/theme";
import { Pressable, PressableProps, StyleSheet, Text, View } from "react-native";
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
      <View style={[styles.actions, { width: (Number(Boolean(onRename)) + Number(Boolean(onDelete))) * 80 }]}>
        {onRename ? <Pressable
          style={[styles.actionButton, styles.rename]}
          onPress={onRename}
        >
          <Text style={styles.actionLabel}>이름 변경</Text>
        </Pressable> : null}

        {onDelete ? <Pressable
          style={[styles.actionButton, styles.delete]}
          onPress={onDelete}
        >
          <Text style={styles.actionLabel}>삭제</Text>
        </Pressable> : null}
      </View>
    );
  }
  return (
    <ReanimatedSwipeable
      renderRightActions={renderActions}
      friction={1}
      rightThreshold={48}
      dragOffsetFromRight={-16}
      overshootLeft={false}
      overshootRight={false}
      childrenContainerStyle={styles.foreground}
    >
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
  );
}

const styles = StyleSheet.create({
  foreground: {
    backgroundColor: Palette.white,
  },
  button: {
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderColor: Palette.border,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 24,
  },
  pressed: {
    opacity: 0.72,
  },
  label: {
    color: Palette.textStrong,
    fontSize: 24,
    fontWeight: "600",
  },
  wordCount: {
    color: Palette.textMuted,
    fontFamily: Fonts.sans, fontSize: FontSizes.small,
    fontWeight: "400",
  },
  actions: {
    width: 160,
    flexDirection: "row",
  },
   actionButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 80,
  },
  rename: {
    backgroundColor: Palette.textMuted,
  },
  delete: {
    backgroundColor: Palette.destructive,
  },
  actionLabel: {
    color: Palette.white,
    fontFamily: Fonts.sans, fontSize: FontSizes.helper,
    fontWeight: "600",
  },
});
