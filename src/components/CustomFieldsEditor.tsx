import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { getCustomFieldNames } from "@/lib/languageStore";
import { fieldNameKey, normalizeCustomFields, uniqueFieldNames, type WordDetail } from "@/lib/wordFields";

type Props = {
  languageId?: string;
  fields: WordDetail[];
  onChange: (fields: WordDetail[]) => void;
  disabled: boolean;
};

export function CustomFieldsEditor({ languageId, fields, onChange, disabled }: Props) {
  const [names, setNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(Boolean(languageId));
  const [loadError, setLoadError] = useState(false);
  const [reload, setReload] = useState(0);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!languageId) return;
    let active = true;
    getCustomFieldNames(languageId)
      .then((items) => { if (active) setNames(items); })
      .catch(() => { if (active) setLoadError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [languageId, reload]);

  function add(label: string) {
    try {
      const next = normalizeCustomFields([...fields, { label, value: "" }]);
      onChange([...fields, next[next.length - 1]]);
      setNewName("");
      setError(null);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "항목 이름을 확인해 주세요.");
    }
  }

  function change(index: number, key: keyof WordDetail, value: string) {
    onChange(fields.map((field, fieldIndex) => fieldIndex === index ? { ...field, [key]: value } : field));
    setError(null);
  }

  const suggestions = uniqueFieldNames([...names, ...fields.map(({ label }) => label)]);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>자유 추가 항목</Text>
      <Text style={styles.hint}>이 폴더에서 사용한 항목</Text>
      {loading ? <ActivityIndicator accessibilityLabel="항목 이름 불러오는 중" /> : null}
      {loadError ? (
        <View style={styles.section}>
          <Text style={styles.error}>항목 이름을 불러오지 못했습니다. 직접 추가할 수 있습니다.</Text>
          <Pressable accessibilityRole="button" disabled={disabled || loading} style={styles.button}
            onPress={() => { setLoadError(false); setLoading(true); setReload((value) => value + 1); }}>
            <Text>다시 불러오기</Text>
          </Pressable>
        </View>
      ) : null}
      <View style={styles.options}>
        {suggestions.map((label) => {
          const selected = fields.some((field) => fieldNameKey(field.label) === fieldNameKey(label));
          return (
            <Pressable key={fieldNameKey(label)} accessibilityRole="button" accessibilityLabel={`${label} 항목 추가`}
              accessibilityState={{ disabled: disabled || selected }} disabled={disabled || selected}
              style={[styles.button, selected && styles.selected]} onPress={() => add(label)}>
              <Text style={selected ? styles.selectedLabel : styles.label}>{selected ? "✓ " : "+ "}{label}</Text>
            </Pressable>
          );
        })}
      </View>
      {!loading && !loadError && !suggestions.length ? <Text style={styles.hint}>아직 사용한 항목이 없습니다. 아래에서 직접 추가하세요.</Text> : null}
      <View style={styles.addRow}>
        <TextInput accessibilityLabel="새 항목 이름" placeholder="예: 성 / 관사, 읽기 유형" placeholderTextColor="#9299a3"
          value={newName} onChangeText={(value) => { setNewName(value); setError(null); }} editable={!disabled}
          autoCapitalize="none" returnKeyType="done" onSubmitEditing={() => { if (newName.trim() && !disabled) add(newName); }}
          style={[styles.input, styles.nameInput]} />
        <Pressable accessibilityRole="button" disabled={disabled || !newName.trim()}
          onPress={() => add(newName)} style={[styles.button, (disabled || !newName.trim()) && styles.disabled]}>
          <Text style={styles.label}>직접 추가</Text>
        </Pressable>
      </View>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {fields.map((field, index) => (
        <View key={index} style={styles.customField}>
          <View style={styles.addRow}>
            <TextInput accessibilityLabel={`자유 항목 ${index + 1} 이름`} value={field.label}
              onChangeText={(value) => change(index, "label", value)} editable={!disabled}
              placeholder="항목 이름" placeholderTextColor="#9299a3" style={[styles.input, styles.nameInput]} />
            <Pressable accessibilityRole="button" accessibilityLabel={`${field.label || "자유"} 항목 빼기`}
              disabled={disabled} style={styles.button} onPress={() => { onChange(fields.filter((_, i) => i !== index)); setError(null); }}>
              <Text style={styles.label}>빼기</Text>
            </Pressable>
          </View>
          <TextInput accessibilityLabel={`${field.label || "자유 항목"} 내용`} value={field.value}
            onChangeText={(value) => change(index, "value", value)} editable={!disabled}
            placeholder="내용을 입력하세요" placeholderTextColor="#9299a3" multiline
            autoCapitalize="none" style={[styles.input, styles.multiline]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  title: { fontSize: 15, fontWeight: "600", color: "#283445" },
  hint: { fontSize: 13, lineHeight: 20, color: "#6b7280" },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  addRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: { minHeight: 52, borderWidth: 1, borderColor: "#dce1e7", borderRadius: 12, padding: 14, color: "#17212f", fontSize: 16, backgroundColor: "#f8fafc" },
  nameInput: { flex: 1, minWidth: 0 },
  multiline: { minHeight: 100, textAlignVertical: "top" },
  button: { minHeight: 44, justifyContent: "center", alignItems: "center", paddingHorizontal: 12, borderWidth: 1, borderColor: "#dce1e7", borderRadius: 12 },
  label: { fontSize: 14, color: "#283445" },
  selected: { backgroundColor: "#17212f", borderColor: "#17212f" },
  selectedLabel: { color: "#ffffff", fontSize: 14 },
  customField: { gap: 10, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: "#dce1e7" },
  disabled: { opacity: 0.4 },
  error: { color: "#b42318", fontSize: 14, lineHeight: 20 },
});
