import { Fonts, FontSizes, Palette } from "@/constants/theme";
import { useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type Props = {
  mode?: "name" | "delete";
  initialName: string;
  title: string;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
};

export function FolderNameDialog({ initialName, title, onClose, onSave, mode = "name" }: Props) {
  const deleting = mode === "delete";
  const confirmLabel = deleting ? "삭제" : "저장";
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  async function save() {
    if (savingRef.current || (!deleting && !name.trim())) return;
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      await onSave(name.trim());
      onClose();
    } catch {
      setError(deleting ? "삭제하지 못했습니다. 다시 시도해 주세요." : "저장하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={() => { if (!savingRef.current) onClose(); }}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <Text style={styles.title}>{title}</Text>
          {deleting ? <Text style={styles.message}>{`"${initialName}" 폴더를 삭제할까요?\n폴더 안의 단어도 함께 삭제되며, 되돌릴 수 없습니다.`}</Text> : <TextInput autoFocus accessibilityLabel="폴더 이름" placeholder="폴더 이름을 입력하세요"
            placeholderTextColor={Palette.gray50} value={name} onChangeText={setName} editable={!saving}
            autoCorrect={false} returnKeyType="done" onSubmitEditing={save} style={styles.input} />}
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" disabled={saving} onPress={onClose} style={styles.button}>
              <Text>취소</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={confirmLabel} disabled={saving || (!deleting && !name.trim())}
              onPress={save} style={[styles.button, styles.save, deleting && styles.delete, (saving || (!deleting && !name.trim())) && styles.disabled]}>
              {saving ? <ActivityIndicator color={Palette.white} /> : <Text style={styles.saveLabel}>{confirmLabel}</Text>}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", padding: 26, backgroundColor: "rgba(0,0,0,0.4)" },
  dialog: { alignSelf: "center", width: "100%", maxWidth: 420, padding: 24, borderRadius: 10, backgroundColor: Palette.background, gap: 20 },
  title: { fontFamily: Fonts.sans, fontSize: FontSizes.wordLabel, fontWeight: "600", color: Palette.text },
  message: { fontFamily: Fonts.sans, fontSize: FontSizes.body, color: Palette.text, lineHeight: 24 },
  delete: { backgroundColor: Palette.destructive },
  input: { minHeight: 56, borderWidth: 1, backgroundColor: Palette.white, borderColor: Palette.gray20, borderRadius: 10, padding: 16, fontFamily: Fonts.sans, fontSize: FontSizes.body, color: Palette.text },
  actions: { flexDirection: "row", gap: 12 },
  button: { flex: 1, minHeight: 48, borderRadius: 8, backgroundColor: Palette.gray10, justifyContent: "center", alignItems: "center" },
  save: { backgroundColor: Palette.main },
  saveLabel: { color: Palette.white, fontFamily: Fonts.sans, fontSize: FontSizes.body, fontWeight: "400" },
  disabled: { opacity: 0.4 },
  error: { color: Palette.errorStrong, fontFamily: Fonts.sans, fontSize: FontSizes.small },
});
