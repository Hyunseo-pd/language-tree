import { Fonts, FontSizes, Palette } from "@/constants/theme";
import type { TestSelection } from "@/lib/cardTest";
import { useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export function CardTestDialog({ available, onClose, onStart }: {
  available: number; onClose: () => void; onStart: (count: number, selection: TestSelection) => void;
}) {
  const [count, setCount] = useState(5);
  const [selection, setSelection] = useState<TestSelection>("random");
  const starting = useRef(false);
  return <Modal transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="닫기" onPress={onClose} />
      <View style={styles.dialog} accessibilityViewIsModal>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>카드 테스트</Text>
          <Text style={styles.label}>몇 개를 복습할까요?</Text>
          <View style={styles.counts}>{[5, 10, 20, 50].map((value) => <Pressable key={value}
            accessibilityRole="radio" accessibilityState={{ checked: count === value }} onPress={() => setCount(value)}
            style={[styles.chip, count === value && styles.selected]}>
            <Text style={[styles.optionLabel, count === value && styles.white]}>{value}개</Text>
          </Pressable>)}</View>
          <Text style={styles.label}>선택 방식</Text>
          <View style={styles.options}>{([['random', '무작위로 선택'], ['newest', '최근 추가한 단어부터'], ['oldest', '오래전에 추가한 단어부터']] as const).map(([value, label]) =>
            <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: selection === value }}
              onPress={() => setSelection(value)} style={styles.option}>
              <View style={styles.radio}>{selection === value ? <View style={styles.dot} /> : null}</View>
              <Text style={styles.optionLabel}>{label}</Text>
            </Pressable>)}</View>
          {available < count ? <Text style={styles.note}>등록된 {available}개의 단어로 진행합니다.</Text> : null}
          <Pressable accessibilityRole="button" disabled={!available} style={styles.start} onPress={() => {
            if (starting.current || !available) return;
            starting.current = true;
            onStart(count, selection);
          }}><Text style={styles.startLabel}>학습 시작</Text></Pressable>
        </ScrollView>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", padding: 26, backgroundColor: "rgba(0,0,0,0.4)" },
  dialog: { alignSelf: "center", width: "100%", maxWidth: 420, maxHeight: "90%", borderRadius: 10, backgroundColor: Palette.background },
  content: { padding: 24, gap: 12 },
  title: { textAlign: "center", paddingBottom: 12, borderBottomWidth: 1, borderColor: Palette.gray60, fontFamily: Fonts.sans, fontSize: FontSizes.wordLabel, fontWeight: "600", color: Palette.gray70 },
  label: { fontFamily: Fonts.sans, fontSize: FontSizes.detail, color: Palette.text, flexShrink: 1 },
  optionLabel: { fontFamily: Fonts.sans, fontSize: FontSizes.body, color: Palette.text, flexShrink: 1 },
  options: { gap: 0 },
  counts: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  chip: { minWidth: 48, minHeight: 40, paddingHorizontal: 12, borderRadius: 24, borderWidth: 1, borderColor: Palette.gray60, alignItems: "center", justifyContent: "center" },
  selected: { backgroundColor: Palette.main2, borderColor: Palette.main2 },
  white: { color: Palette.white },
  option: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 44 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: Palette.gray70, alignItems: "center", justifyContent: "center" },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: Palette.main2 },
  note: { fontFamily: Fonts.sans, color: Palette.gray60, fontSize: FontSizes.small },
  start: { minHeight: 56, alignItems: "center", justifyContent: "center", borderRadius: 32, backgroundColor: Palette.main },
  startLabel: { color: Palette.white, fontFamily: Fonts.sans, fontSize: FontSizes.title, fontWeight: "700" },
});
