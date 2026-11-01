import { Palette } from "@/constants/theme";
import { WordnoteIcons } from "@/constants/wordnote";
import { Image } from "expo-image";
import { Pressable, StyleSheet, type PressableProps } from "react-native";

type IconButtonProps = PressableProps & {
  icon: keyof typeof WordnoteIcons;
  accessibilityLabel: string;
};

export function IconButton({ icon, style, ...props }: IconButtonProps) {
  return (
    <Pressable accessibilityRole="button" {...props}
      style={(state) => [styles.button, state.pressed && styles.pressed,
        typeof style === "function" ? style(state) : style]}>
      <Image source={WordnoteIcons[icon]} style={styles.icon} contentFit="contain" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22 },
  pressed: { backgroundColor: Palette.surfacePressed },
  icon: { width: 36, height: 36 },
});
