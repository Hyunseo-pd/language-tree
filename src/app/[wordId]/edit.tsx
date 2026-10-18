import { router, useLocalSearchParams, type Href } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getWord, updateWord } from "@/lib/languageStore";

type WordFields = { word: string; meaning: string; example: string };

export default function WordEditScreen() {
  const { wordId, languageId } = useLocalSearchParams<{ wordId: string; languageId?: string }>();
  return <WordEditor key={`${languageId}/${wordId}`} wordId={wordId} languageId={languageId} />;
}

function WordEditor({ wordId, languageId }: { wordId: string; languageId?: string }) {
  const [fields, setFields] = useState<WordFields>({ word: "", meaning: "", example: "" });
  const [original, setOriginal] = useState<WordFields | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [reload, setReload] = useState(0);
  const savingRef = useRef(false);

  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(() => {
        if (!languageId || !wordId) {
          throw new Error("\uB2E8\uC5B4 \uC815\uBCF4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uBAA9\uB85D\uC5D0\uC11C \uB2E4\uC2DC \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.");
        }
        return getWord(languageId, wordId);
      })
      .then((word) => {
        if (!active) return;
        if (!word) {
          setError("단어를 찾을 수 없습니다.");
          return;
        }
        const next = { word: word.word, meaning: word.meaning, example: word.example ?? "" };
        setFields(next);
        setOriginal(next);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "불러오지 못했습니다.");
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [languageId, wordId, reload]);

  const dirty = original !== null && (fields.word !== original.word
    || fields.meaning !== original.meaning || fields.example !== original.example);
  const valid = Boolean(fields.word.trim() && fields.meaning.trim());

  function changeField(key: keyof WordFields, value: string) {
    setFields((previous) => ({ ...previous, [key]: value }));
    setSaved(false);
    setError(null);
  }

  async function save() {
    if (!languageId || !original || !valid || !dirty || savingRef.current) return;
    savingRef.current = true;
    setIsSaving(true);
    setError(null);
    Keyboard.dismiss();
    const next = { word: fields.word.trim(), meaning: fields.meaning.trim(), example: fields.example.trim() };
    try {
      await updateWord(languageId, wordId, next);
      setFields(next);
      setOriginal(next);
      setSaved(true);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "저장하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="단어 목록으로" disabled={isSaving}
            style={styles.headerButton}
            onPress={() => router.dismissTo(languageId ? `/languages/${encodeURIComponent(languageId)}` as Href : "/")}>
            <Text style={styles.back}>{"\u2039"}</Text>
          </Pressable>
          <Text style={styles.title}>단어 편집</Text>
          <Pressable accessibilityRole="button" disabled={isLoading || isSaving || !original}
            style={styles.headerButton}
            onPress={() => router.navigate({ pathname: "/[wordId]", params: { wordId, languageId } } as Href)}>
            <Text style={styles.headerLabel}>카드</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          {isLoading ? <ActivityIndicator style={styles.loading} /> : null}
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          {!isLoading && !original ? (
            <Pressable accessibilityRole="button" style={styles.secondary} onPress={() => { setError(null); setIsLoading(true); setReload((value) => value + 1); }}>
              <Text>다시 불러오기</Text>
            </Pressable>
          ) : null}
          {!isLoading && original ? (
            <>
              <Text style={styles.description}>단어와 뜻을 정리하고, 예문을 함께 남겨 보세요.</Text>
              {([
                { key: "word", label: "단어", placeholder: "단어를 입력하세요", multiline: false },
                { key: "meaning", label: "뜻", placeholder: "뜻을 입력하세요", multiline: true },
                { key: "example", label: "예문 (선택)", placeholder: "기억하고 싶은 예문을 남겨 보세요", multiline: true },
              ] as const).map((field) => (
                <View key={field.key} style={styles.field}>
                  <Text style={styles.label}>{field.label}</Text>
                  <TextInput accessibilityLabel={field.label} value={fields[field.key]}
                    onChangeText={(value) => changeField(field.key, value)} editable={!isSaving}
                    placeholder={field.placeholder} placeholderTextColor="#9299a3"
                    autoCapitalize="none" autoCorrect={false} multiline={field.multiline}
                    style={[styles.input, field.multiline && styles.multiline]} />
                </View>
              ))}
              <Text accessibilityLiveRegion="polite" style={saved ? styles.success : styles.hint}>
                {saved ? "저장했습니다." : !valid ? "단어와 뜻을 모두 입력해 주세요." : dirty ? "저장하지 않은 변경사항이 있습니다." : "변경 후 저장 버튼을 눌러 주세요."}
              </Text>
              <Pressable accessibilityRole="button" disabled={!valid || !dirty || isSaving}
                onPress={save} style={[styles.save, (!valid || !dirty || isSaving) && styles.disabled]}>
                {isSaving ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.saveLabel}>변경사항 저장</Text>}
              </Pressable>
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#ffffff" },
  screen: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  headerButton: { minWidth: 52, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#f3f4f6" },
  back: { fontSize: 32, color: "#17212f" },
  headerLabel: { fontSize: 15, fontWeight: "600", color: "#17212f" },
  title: { flex: 1, textAlign: "center", fontSize: 21, fontWeight: "700", color: "#17212f" },
  content: { padding: 24, gap: 22, paddingBottom: 48 },
  loading: { marginTop: 48 },
  description: { color: "#6b7280", fontSize: 14, lineHeight: 22 },
  field: { gap: 10 },
  label: { fontSize: 15, fontWeight: "600", color: "#283445" },
  input: { borderWidth: 1, borderColor: "#dce1e7", backgroundColor: "#f8fafc", borderRadius: 14, padding: 16, minHeight: 56, fontSize: 17, color: "#17212f" },
  multiline: { minHeight: 112, textAlignVertical: "top" },
  hint: { fontSize: 13, lineHeight: 20, color: "#6b7280" },
  success: { fontSize: 13, color: "#18734b" },
  error: { color: "#b42318", fontSize: 14, lineHeight: 22 },
  save: { minHeight: 54, borderRadius: 14, backgroundColor: "#17212f", alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.4 },
  saveLabel: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
  secondary: { minHeight: 48, alignItems: "center", justifyContent: "center", backgroundColor: "#f3f4f6", borderRadius: 12 },
});
