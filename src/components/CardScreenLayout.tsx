import type { PropsWithChildren, ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconButton } from "@/components/ui/IconButton";
import { Fonts, FontSizes, Palette } from "@/constants/theme";

type Props = PropsWithChildren<{
  index: number;
  total: number;
  onExit: () => void;
  onPrevious: () => void;
  onNext: () => void;
  disabled?: boolean;
  saving?: boolean;
  nextLabel?: string;
  actions?: ReactNode;
}>;

export function CardScreenLayout({ index, total, onExit, onPrevious, onNext, disabled, saving, nextLabel = "다음 단어", actions, children }: Props) {
  return <SafeAreaView style={styles.safeArea}>
    <View style={styles.screen}>
      <View style={styles.header}>
        <IconButton icon="back" accessibilityLabel="단어 목록으로" onPress={onExit} disabled={saving} />
        <Pressable accessibilityRole="button" accessibilityLabel="단어 목록으로" onPress={onExit} disabled={saving} style={styles.counterButton}>
          <Text style={styles.counter}>{total ? index + 1 : 0}/{total}</Text>
        </Pressable>
        <View style={styles.actions}>{actions}</View>
      </View>
      {children}
      <View style={styles.footer}>
        <IconButton icon="previous" accessibilityLabel="이전 단어" onPress={onPrevious} disabled={disabled || saving} />
        {saving ? <ActivityIndicator color={Palette.main} /> : null}
        <IconButton icon="next" accessibilityLabel={nextLabel} onPress={onNext} disabled={disabled || saving} />
      </View>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Palette.background },
  screen: { flex: 1, paddingHorizontal: 16, paddingBottom: 34 },
  header: { height: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  counterButton: { position: "absolute", left: 88, right: 88, minHeight: 44, alignItems: "center", justifyContent: "center" },
  counter: { textAlign: "center", fontFamily: Fonts.sans, fontSize: FontSizes.bodyLarge, fontWeight: "400", lineHeight: 24, color: Palette.text },
  footer: { height: 48, marginTop: 4, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});
