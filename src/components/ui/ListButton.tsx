import { Fonts, FontSizes, Palette } from "@/constants/theme";
import { Pressable, PressableProps, StyleSheet, Text } from "react-native";

type ListButtonProps = PressableProps & {
  label: string;
};

export function ListButton({ label, style, ...props }: ListButtonProps) {
  return (
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Palette.white,
    borderBottomWidth: 1,
    borderColor: Palette.borderSubtle,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 16,
  },
  pressed: {
    opacity:1,
  },
  label: {
    color: Palette.textStrong,
    fontFamily: Fonts.sans, fontSize: FontSizes.title,
    fontWeight: "400",
  },
});
