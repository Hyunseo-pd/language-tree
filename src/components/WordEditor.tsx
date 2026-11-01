import { Palette, Fonts, FontSizes } from "@/constants/theme";
import { router, type Href } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CustomFieldsEditor } from "@/components/CustomFieldsEditor";
import { createWord, getWord, updateWord } from "@/lib/languageStore";

import { normalizeWordValues, optionalWordFields, type OptionalWordField, type WordDetail, type WordValues } from "@/lib/wordFields";

type WordFields = Required<Omit<WordValues, "customFields">>;
const emptyFields: WordFields = { word: "", meaning: "", reading: "", partOfSpeech: "", inflections: "", example: "" };

export function WordEditor({ wordId, languageId }: { wordId?: string; languageId?: string }) {
  const [fields, setFields] = useState<WordFields>(emptyFields);
  const [original, setOriginal] = useState<WordFields | null>(wordId ? null : emptyFields);
  const [selected, setSelected] = useState<OptionalWordField[]>([]);
  const [customFields, setCustomFields] = useState<WordDetail[]>([]);
  const [originalCustomFields, setOriginalCustomFields] = useState<WordDetail[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(wordId));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [reload, setReload] = useState(0);
  const savingRef = useRef(false);

  useEffect(() => {
    if (!wordId) return;
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
        const next: WordFields = { word: word.word, meaning: word.meaning, reading: word.reading ?? "", partOfSpeech: word.partOfSpeech ?? "", inflections: word.inflections ?? "", example: word.example ?? "" };
        setSelected(optionalWordFields.filter(({ key }) => Boolean(next[key])).map(({ key }) => key));
        setCustomFields(word.customFields ?? []);
        setOriginalCustomFields(word.customFields ?? []);
        setFields(next);
        setOriginal(next);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "불러오지 못했습니다.");
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [languageId, wordId, reload]);

  const effectiveFields = { ...fields };
  optionalWordFields.forEach(({ key }) => { if (!selected.includes(key)) effectiveFields[key] = ""; });
  const dirty = original !== null && ((Object.keys(effectiveFields) as (keyof WordFields)[])
    .some((key) => effectiveFields[key] !== original[key])
    || JSON.stringify(customFields) !== JSON.stringify(originalCustomFields));
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
    try {
      const next = normalizeWordValues({ ...effectiveFields, customFields });
      if (wordId) {
        await updateWord(languageId, wordId, next);
      } else {
        await createWord(languageId, next);
        router.dismissTo(`/languages/${encodeURIComponent(languageId)}` as Href);
      }
      const { customFields: savedCustomFields = [], ...savedFields } = next;
      setFields(savedFields);
      setOriginal(savedFields);
      setCustomFields(savedCustomFields);
      setOriginalCustomFields(savedCustomFields);
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
          <Text style={styles.title}>{wordId ? "단어 편집" : "단어 추가"}</Text>
          {wordId ? <Pressable accessibilityRole="button" disabled={isLoading || isSaving || !original}
            style={styles.headerButton}
            onPress={() => router.navigate({ pathname: "/[wordId]", params: { wordId, languageId } } as Href)}>
            <Text style={styles.headerLabel}>카드</Text>
          </Pressable> : <View style={styles.headerButtonSpace} />}
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
              <Text style={styles.description}>단어와 뜻을 입력하고, 더 기록할 항목을 선택하세요.</Text>
              {([
                { key: "word", label: "단어", placeholder: "단어를 입력하세요", multiline: false },
                { key: "meaning", label: "뜻", placeholder: "뜻을 입력하세요", multiline: true },
              ] as const).map((field) => (
                <View key={field.key} style={styles.field}>
                  <Text style={styles.label}>{field.label}</Text>
                  <TextInput accessibilityLabel={field.label} value={fields[field.key]}
                    onChangeText={(value) => changeField(field.key, value)} editable={!isSaving}
                    placeholder={field.placeholder} placeholderTextColor={Palette.placeholder}
                    autoCapitalize="none" autoCorrect={false} multiline={field.multiline}
                    style={[styles.input, field.multiline && styles.multiline]} />
                </View>
              ))}
              <View style={styles.field}>
                <Text style={styles.label}>추가로 기록할 항목</Text>
                <View style={styles.options}>
                  {optionalWordFields.map(({ key, label }) => (
                    <Pressable key={key} accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected.includes(key), disabled: isSaving }}
                      disabled={isSaving} onPress={() => {
                        setSelected((previous) => previous.includes(key) ? previous.filter((item) => item !== key) : [...previous, key]);
                        setSaved(false);
                        setError(null);
                      }} style={[styles.option, selected.includes(key) && styles.optionSelected]}>
                      <Text style={[styles.optionLabel, selected.includes(key) && styles.optionLabelSelected]}>
                        {selected.includes(key) ? "✓ " : "+ "}{label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.hint}>선택한 항목만 저장됩니다. 선택을 해제하면 해당 내용은 저장 시 비워집니다.</Text>
              </View>
              {optionalWordFields.filter(({ key }) => selected.includes(key)).map(({ key, label, placeholder }) => (
                <View key={key} style={styles.field}>
                  <Text style={styles.label}>{label}</Text>
                  <TextInput accessibilityLabel={label} value={fields[key]}
                    onChangeText={(value) => changeField(key, value)} editable={!isSaving}
                    placeholder={placeholder} placeholderTextColor={Palette.placeholder}
                    autoCapitalize="none" autoCorrect={false} multiline
                    style={[styles.input, styles.multiline]} />
                </View>
              ))}
              <CustomFieldsEditor languageId={languageId} fields={customFields} disabled={isSaving}
                onChange={(next) => { setCustomFields(next); setSaved(false); setError(null); }} />
              <Text accessibilityLiveRegion="polite" style={saved ? styles.success : styles.hint}>
                {!languageId ? "언어 목록에서 다시 선택해 주세요." : saved ? "저장했습니다." : !valid ? "단어와 뜻을 모두 입력해 주세요." : dirty ? "저장하지 않은 변경사항이 있습니다." : "변경 후 저장 버튼을 눌러 주세요."}
              </Text>
              <Pressable accessibilityRole="button" disabled={!languageId || !valid || !dirty || isSaving}
                onPress={save} style={[styles.save, (!languageId || !valid || !dirty || isSaving) && styles.disabled]}>
                {isSaving ? <ActivityIndicator color={Palette.white} /> : <Text style={styles.saveLabel}>{wordId ? "변경사항 저장" : "단어 추가"}</Text>}
              </Pressable>
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Palette.white },
  screen: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  headerButton: { minWidth: 52, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: Palette.surfaceMuted },
  back: { fontFamily: Fonts.sans, fontSize: FontSizes.display, color: Palette.textInput },
  headerButtonSpace: { width: 52, minHeight: 48 },
  headerLabel: { fontFamily: Fonts.sans, fontSize: FontSizes.label, fontWeight: "600", color: Palette.textInput },
  title: { flex: 1, textAlign: "center", fontFamily: Fonts.sans, fontSize: FontSizes.heading, fontWeight: "700", color: Palette.textInput },
  content: { padding: 24, gap: 22, paddingBottom: 48 },
  loading: { marginTop: 48 },
  description: { color: Palette.textHint, fontFamily: Fonts.sans, fontSize: FontSizes.small, lineHeight: 22 },
  field: { gap: 10 },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: { minHeight: 44, paddingHorizontal: 14, justifyContent: "center", borderWidth: 1, borderColor: Palette.borderInput, borderRadius: 12 },
  optionSelected: { backgroundColor: Palette.textInput, borderColor: Palette.textInput },
  optionLabel: { color: Palette.textLabel, fontFamily: Fonts.sans, fontSize: FontSizes.label },
  optionLabelSelected: { color: Palette.white },
  label: { fontFamily: Fonts.sans, fontSize: FontSizes.label, fontWeight: "600", color: Palette.textLabel },
  input: { borderWidth: 1, borderColor: Palette.borderInput, backgroundColor: Palette.surfaceInput, borderRadius: 14, padding: 16, minHeight: 56, fontFamily: Fonts.sans, fontSize: FontSizes.input, color: Palette.textInput },
  multiline: { minHeight: 112, textAlignVertical: "top" },
  hint: { fontFamily: Fonts.sans, fontSize: FontSizes.helper, lineHeight: 20, color: Palette.textHint },
  success: { fontFamily: Fonts.sans, fontSize: FontSizes.helper, color: Palette.success },
  error: { color: Palette.errorStrong, fontFamily: Fonts.sans, fontSize: FontSizes.small, lineHeight: 22 },
  save: { minHeight: 54, borderRadius: 14, backgroundColor: Palette.textInput, alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.4 },
  saveLabel: { color: Palette.white, fontFamily: Fonts.sans, fontSize: FontSizes.body, fontWeight: "600" },
  secondary: { minHeight: 48, alignItems: "center", justifyContent: "center", backgroundColor: Palette.surfaceMuted, borderRadius: 12 },
});
