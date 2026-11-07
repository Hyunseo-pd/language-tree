import { CardScreenLayout } from "@/components/CardScreenLayout";
import { FlipCard } from "@/components/FlipCard";
import { ScreenShell } from "@/components/ScreenShell";
import { WordListItem } from "@/components/WordListItem";
import { WordSortDropdown } from "@/components/WordSortDropdown";
import { IconButton } from "@/components/ui/IconButton";
import { Fonts, FontSizes, Palette } from "@/constants/theme";
import { completeCardTest, selectTestWords } from "@/lib/cardTest";
import { getCachedWords, subscribeToWords, type WordItem } from "@/lib/languageStore";
import { sortWords, type WordSortOrder } from "@/lib/wordSort";
import { router, useLocalSearchParams, usePreventRemove, type Href } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";

export default function CardTestScreen() {
  const { languageId, count, selection } = useLocalSearchParams<{ languageId?: string; count?: string; selection?: string }>();
  const [words, setWords] = useState<WordItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [flipped, setFlipped] = useState<Set<string>>(() => new Set());
  const [page, setPage] = useState<"cards" | "complete" | "list">("cards");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const savingRef = useRef(false);
  const [allowExit, setAllowExit] = useState(false);
  const exitAlertOpen = useRef(false);
  const [showMeanings, setShowMeanings] = useState(true);
  const [order, setOrder] = useState<WordSortOrder>("date");
  const [sortOpen, setSortOpen] = useState(false);
  const [randomIds, setRandomIds] = useState<string[]>([]);

  usePreventRemove(!saved && !allowExit && Boolean(words?.length), ({ repeat }) => {
    if (savingRef.current || exitAlertOpen.current) return;
    const leave = () => {
      exitAlertOpen.current = false;
      setAllowExit(true);
      repeat();
    };
    if (Platform.OS === "web") {
      if (window.confirm("나가시겠습니까?\n완료하지 않은 테스트는 기록되지 않습니다.")) leave();
      return;
    }
    exitAlertOpen.current = true;
    Alert.alert("나가시겠습니까?", "완료하지 않은 테스트는 기록되지 않습니다.", [
      { text: "취소", style: "cancel", onPress: () => { exitAlertOpen.current = false; } },
      { text: "나가기", style: "destructive", onPress: leave },
    ], { cancelable: true, onDismiss: () => { exitAlertOpen.current = false; } });
  });

  useEffect(() => {
    if (!languageId) return;
    let initialized = false;
    const initialize = (items: WordItem[]) => {
      if (initialized) return;
      initialized = true;
      const size = [5, 10, 20, 50].includes(Number(count)) ? Number(count) : 5;
      setWords(selectTestWords(items, size, selection === "newest" || selection === "oldest" ? selection : "random"));
      setError(null);
    };
    const cached = getCachedWords(languageId);
    if (cached) initialize(cached);
    return subscribeToWords(languageId, initialize, () => setError("단어를 불러오지 못했습니다. 목록에서 다시 시작해 주세요."));
  }, [languageId, count, selection]);

  const resultWords = useMemo(() => sortWords(words ?? [], { order, randomIds }), [words, order, randomIds]);
  const current = words?.[index];
  const allFlipped = Boolean(words?.length) && flipped.size === words?.length;
  const exit = () => router.dismissTo(languageId ? `/languages/${encodeURIComponent(languageId)}` as Href : "/");

  async function finish() {
    if (!allFlipped || !languageId || !words || savingRef.current) return;
    if (saved) { setPage("complete"); return; }
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      await completeCardTest(languageId, words.map(({ id }) => id));
      setSaved(true);
      setPage("complete");
    } catch {
      setError("학습 기록을 저장하지 못했습니다. 다음 버튼으로 다시 시도해 주세요.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  function move(direction: number) {
    if (!words?.length || savingRef.current) return;
    setShowMeaning(false);
    if (direction > 0 && allFlipped) { void finish(); return; }
    setIndex((index + direction + words.length) % words.length);
  }

  if (page === "list") return <ScreenShell compact scrollable={false}
    title={`이번 학습 단어 (${words?.length ?? 0})`}
    headerLeft={<IconButton icon="back" accessibilityLabel="단어 목록으로" onPress={exit} disabled={saving} />}
    toolbar={<View style={styles.toolbar}>
      <Pressable accessibilityRole="switch" accessibilityLabel="뜻 표시" accessibilityState={{ checked: showMeanings }}
        style={styles.toggle} onPress={() => setShowMeanings(!showMeanings)}><Text style={styles.toggleLabel}>{showMeanings ? "뜻 숨기기" : "뜻 보기"}</Text></Pressable>
      <WordSortDropdown value={order} open={sortOpen} onOpenChange={setSortOpen} onChange={(next) => {
        setOrder(next);
        if (next === "random") setRandomIds(selectTestWords(words ?? [], words?.length ?? 0, "random").map(({ id }) => id));
      }} />
    </View>}>
    <FlatList data={resultWords} keyExtractor={(word) => word.id}
      showsVerticalScrollIndicator={false} initialNumToRender={16} extraData={showMeanings}
      renderItem={({ item }) => <WordListItem label={item.word} meaning={item.meaning} showMeaning={showMeanings}
        onPress={() => { setIndex(words!.findIndex(({ id }) => id === item.id)); setShowMeaning(false); setPage("cards"); }}
        onEdit={() => router.push({ pathname: "/[wordId]/edit", params: { wordId: item.id, languageId } } as Href)} />} />
  </ScreenShell>;

  return <CardScreenLayout index={index} total={words?.length ?? 0} onExit={exit} saving={saving}
    disabled={!current} nextLabel={allFlipped ? "테스트 완료" : "다음 단어"}
    onPrevious={() => {
      if (page === "complete") { setPage("cards"); setShowMeaning(false); } else move(-1);
    }}
    onNext={() => { if (page === "complete") setPage("list"); else move(1); }}>
    {!languageId ? <Text style={styles.error}>언어 목록에서 테스트를 시작해 주세요.</Text> : null}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {!words && languageId && !error ? <ActivityIndicator /> : null}
    {words?.length === 0 ? <Text style={styles.hint}>테스트할 단어가 없습니다.</Text> : null}
    {current ? <>

      <View style={styles.viewport}>
        {page === "complete" ? <Pressable accessibilityRole="button" accessibilityLabel="이번 학습 단어 보기"
          style={styles.complete} onPress={() => setPage("list")}>
          <Text style={styles.check}>✓</Text>
          <Text style={styles.completedText}>오늘 {words!.length}개의 단어를 만났어요</Text>
          <Text style={styles.hint}>터치해서 나가기</Text>
        </Pressable> : <Pressable accessibilityRole="button" disabled={saving}
          accessibilityLabel={showMeaning ? `${current.word}, ${current.meaning}` : current.word}
          accessibilityHint="터치해서 카드를 뒤집습니다" style={styles.card} onPress={() => {
            if (!showMeaning) setFlipped((previous) => new Set(previous).add(current.id));
            setShowMeaning(!showMeaning);
          }}>
          <FlipCard key={current.id} word={current} showMeaning={showMeaning} hideExample />
        </Pressable>}
      </View>
    </> : null}
  </CardScreenLayout>;
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  toggle: { minHeight: 44, paddingHorizontal: 8, justifyContent: "center" },
  toggleLabel: { fontFamily: Fonts.sans, fontSize: FontSizes.body, color: Palette.gray60 },
  viewport: { flex: 1, paddingVertical: 8 },
  card: { flex: 1, borderRadius: 10 },
  complete: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: Palette.gray50, backgroundColor: Palette.background,
    boxShadow: "2px 2px 4px rgba(0, 0, 0, 0.1)", justifyContent: "center", alignItems: "center", padding: 24 },
  check: { fontSize: FontSizes.display, color: Palette.gray70, marginBottom: 20 },
  completedText: { fontFamily: Fonts.sans, fontSize: FontSizes.title, fontWeight: "700", color: Palette.text, textAlign: "center" },
  hint: { marginTop: 16, fontFamily: Fonts.sans, fontSize: FontSizes.body, lineHeight: 24, color: Palette.gray50, textAlign: "center" },
  error: { fontFamily: Fonts.sans, fontSize: FontSizes.small, color: Palette.error, padding: 12 },
});
