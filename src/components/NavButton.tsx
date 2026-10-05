import { Pressable, PressableProps, StyleSheet, Text } from "react-native";

type NavButtonProps = PressableProps & {
  label: string;
};

export function NavButton({ label, style, ...props }: NavButtonProps) {
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
    alignItems: "center",
    borderColor: "#111111",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 16,
  },
  pressed: {
    opacity: 0.72,
  },
  label: {
    color: "#111111",
    fontSize: 16,
    fontWeight: "600",
  },
});
