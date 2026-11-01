import { Image } from "expo-image";
import { useRef, useState, type ComponentRef } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { Fonts, FontSizes, Palette } from "@/constants/theme";
import { WordnoteIcons } from "@/constants/wordnote";

type DeleteButtonProps = {
  placement?: "above" | "below";
  onDelete: () => Promise<void>;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function DeleteButton({ onDelete, disabled = false, accessibilityLabel = "삭제 메뉴", placement = "above" }: DeleteButtonProps) {
  const trigger = useRef<ComponentRef<typeof View>>(null);
  const inFlight = useRef(false);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { width, height } = useWindowDimensions();
  const menuWidth = Math.min(100, width - 16);

  function close() {
    if (!inFlight.current) setAnchor(null);
  }

  async function confirmDelete() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      await onDelete();
      setAnchor(null);
    } catch {
      setError("삭제하지 못했어요. 다시 시도해 주세요.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <>
      <Pressable ref={trigger} accessibilityRole="button" accessibilityLabel={accessibilityLabel}
        accessibilityState={{ expanded: anchor !== null, disabled: disabled || busy }}
        disabled={disabled || busy} style={styles.trigger}
        onPress={() => {
          setError(null);
          trigger.current?.measureInWindow((x, y, measuredWidth) => setAnchor({ x: x + measuredWidth / 2, y }));
        }}>
        <Image source={WordnoteIcons.trash} style={styles.icon} contentFit="contain" />
      </Pressable>
      <Modal visible={anchor !== null} transparent animationType="none"
        statusBarTranslucent navigationBarTranslucent onRequestClose={close}>
        <View style={styles.overlay} onAccessibilityEscape={close}>
          <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="삭제 메뉴 닫기" onPress={close} disabled={busy} />
          <View accessibilityViewIsModal style={[styles.menu, {
            width: menuWidth,
            left: Math.max(8, Math.min((anchor?.x ?? 0) - menuWidth / 2, width - menuWidth - 8)),
            ...(placement === "below"
              ? { top: (anchor?.y ?? 0) + 44 + 8 }
              : { bottom: Math.max(8, height - (anchor?.y ?? 0) + 8) }),
          }]}>
            <Pressable accessibilityRole="button" accessibilityLabel="삭제 확인" accessibilityState={{ busy, disabled: busy }}
              disabled={busy} onPress={confirmDelete} style={({ pressed }) => [styles.confirm, pressed && styles.pressed]}>
              {busy ? <ActivityIndicator color={Palette.destructive} /> : <Text style={styles.label}>삭제</Text>}
            </Pressable>
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
  icon: { width: 36, height: 36 },
  overlay: { flex: 1 },
  menu: { position: "absolute", padding:8, backgroundColor: Palette.white, borderWidth: 1, borderColor: Palette.gray50, borderRadius: 9999 },
  confirm: { minHeight: 36, alignItems: "center", justifyContent: "center", borderRadius: 9999 },
  pressed: { backgroundColor: Palette.surfacePressed },
  label: { fontFamily: Fonts.sans, fontSize: FontSizes.body, fontWeight: "600", color: Palette.destructive },
  error: { fontFamily: Fonts.sans, fontSize: FontSizes.small, color: Palette.error, padding: 8 },
});
