import { Fonts, FontSizes, Palette as palette } from "@/constants/theme";
import { Image } from "expo-image";
import { useRef, useState, type ComponentRef } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { WordnoteIcons } from "@/constants/wordnote";

export type DropdownOption<T extends string> = { value: T; label: string; destructive?: boolean };

export type DropdownMenuProps<T extends string> = {
  label: string;
  options: readonly DropdownOption<T>[];
  value?: T;
  icon?: keyof typeof WordnoteIcons;
  onChange: (value: T) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
};

export function DropdownMenu<T extends string>({
  label, options, value, onChange, open, onOpenChange, disabled = false, icon,
}: DropdownMenuProps<T>) {
  const trigger = useRef<ComponentRef<typeof View>>(null);
  const [anchor, setAnchor] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const { width, height } = useWindowDimensions();
  const menuWidth = Math.min(180, width - 16);
  const top = Math.min((anchor?.y ?? 0) + (anchor?.height ?? 0) + 8, height - 64);
  const left = Math.max(8, Math.min((anchor?.x ?? 0) + (anchor?.width ?? 0) - menuWidth, width - menuWidth - 8));

  function toggle() {
    if (disabled) return;
    if (open) {
      onOpenChange(false);
      return;
    }
    trigger.current?.measureInWindow((x, y, measuredWidth, measuredHeight) => {
      setAnchor({ x, y, width: measuredWidth, height: measuredHeight });
      onOpenChange(true);
    });
  }

  return (
    <View style={styles.container}>
      <Pressable ref={trigger} accessibilityRole="button" accessibilityLabel={label}
        accessibilityState={{ expanded: open, disabled }} disabled={disabled}
        onPress={toggle} style={({ pressed }) => [styles.trigger, icon && styles.iconTrigger, (pressed || disabled) && styles.dimmed]}>
        {!icon && <Text style={styles.label}>{label}</Text>}
        <Image source={icon ? WordnoteIcons[icon] : open ? WordnoteIcons.sortUp : WordnoteIcons.sort} style={styles.icon} contentFit="contain" />
      </Pressable>
      <Modal visible={open && !disabled && anchor !== null} transparent animationType="none"
        statusBarTranslucent navigationBarTranslucent onRequestClose={() => onOpenChange(false)}>
        <View style={styles.overlay} onAccessibilityEscape={() => onOpenChange(false)}>
          <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button"
            accessibilityLabel={`${label} 메뉴 닫기`} onPress={() => onOpenChange(false)} />
          <View accessibilityViewIsModal style={[styles.menu, { top, left, width: menuWidth, maxHeight: Math.max(48, height - top - 16) }]}>
            <ScrollView keyboardShouldPersistTaps="handled">
              {options.map((option) => (
                <Pressable key={option.value} accessibilityRole="button"
                  accessibilityState={{ selected: option.value === value }}
                  style={({ pressed }) => [styles.option, option.value === value && styles.selected, pressed && styles.dimmed]}
                  onPress={() => { onOpenChange(false); onChange(option.value); }}>
                  <Text style={[styles.optionLabel, option.destructive && styles.destructiveLabel, option.value === value && styles.selectedLabel]}>{option.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: "center" },
  trigger: { minHeight: 36, flexDirection: "row", alignItems: "center", backgroundColor: palette.white, borderWidth: 1, borderColor: palette.gray50, borderRadius: 12, paddingHorizontal: 4, gap: 4 },
  iconTrigger: { width: 48, height: 48, justifyContent: "center", borderWidth: 0, backgroundColor: "transparent", paddingHorizontal: 0 },
  destructiveLabel: { color: palette.destructive },
  label: { minWidth: 36, textAlign: "center", fontFamily: Fonts.sans, fontSize: FontSizes.body, color: palette.text },
  icon: { width: 36, height: 36 },
  dimmed: { opacity: 0.6 },
  overlay: { flex: 1 },
  menu: { position: "absolute", padding: 8, backgroundColor: palette.white, borderRadius: 12, borderWidth: 1, borderColor: palette.gray50, shadowColor: palette.text, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  option: { minHeight: 48, justifyContent: "center", paddingHorizontal: 8, borderRadius: 8 },
  selected: { backgroundColor: palette.main2 },
  optionLabel: { color: palette.text, fontFamily: Fonts.sans, fontSize: FontSizes.body },
  selectedLabel: { color: palette.background },
});
