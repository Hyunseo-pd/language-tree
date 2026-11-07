import { WordSortDropdown } from "@/components/WordSortDropdown";
import { CardTestDialog } from "@/components/CardTestDialog";
import { IconButton } from "@/components/ui/IconButton";
import { Fonts, FontSizes, Palette } from "@/constants/theme";
import { WordnoteIcons } from "@/constants/wordnote";
import { Image } from "expo-image";
import { Link, router, useFocusEffect, useLocalSearchParams, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import { ActivityIndicator, Animated, FlatList, Keyboard, Pressable, StyleSheet, Text, TextInput, useAnimatedValue, View } from "react-native";

import { ScreenShell } from "@/components/ScreenShell";
import { WordListItem } from "@/components/WordListItem";
import { getCachedWords, getLanguageName, subscribeToWords, type WordItem } from "@/lib/languageStore";
import { selectWordSort, sortWords, useWordSort, type WordSortOrder } from "@/lib/wordSort";
import { useWordListReturn } from "@/hooks/useWordListReturn";
import { getCardReturn } from "@/lib/wordListReturn";

export default function LanguageWordsScreen() {
  const { languageId, languageName } = useLocalSearchParams<{
    languageId: string;
    languageName?: string;
  }>();
  const [language, setLanguage] = useState<{ id: string; name: string } | null>(null);
  const sort = useWordSort(languageId);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [showMeanings, setShowMeanings] = useState(true);
  const [words, setWords] = useState<WordItem[]>(() => getCachedWords(languageId) ?? []);
  const [isLoading, setIsLoading] = useState(() => !getCachedWords(languageId));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const list = useRef<FlatList<WordItem>>(null);
  const [listHeight, setListHeight] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeToWords(
      languageId,
      (nextWords) => {
        setWords(nextWords);
        setIsLoading(false);
        setErrorMessage(null);
      },
      (error) => {
        setErrorMessage(error.message);
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, [languageId]);

  function selectSort(order: WordSortOrder) {
    selectWordSort(languageId, order, words);
  }

  const sortedWords = useMemo(() => sortWords(words, sort), [words, sort]);
  const query = search.normalize("NFC").trim().toLocaleLowerCase();
  const visibleWords = useMemo(() => sortedWords.filter((word) =>
    [word.word, word.meaning].some((value) => value.normalize("NFC").toLocaleLowerCase().includes(query)),
  ), [sortedWords, query]);
  useFocusEffect(useCallback(() => {
    if (getCardReturn(languageId)) {
      setSearch("");
      setSearchOpen(false);
    }
  }, [languageId]));
  const { highlight, onScrollToIndexFailed, onHighlightComplete } = useWordListReturn(languageId, visibleWords, list, listHeight);

  useFocusEffect(useCallback(() => {
    let isActive = true;

    getLanguageName(languageId)
      .then((name) => {
        if (isActive) {
          setLanguage({ id: languageId, name: name ?? "단어 목록" });
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to load language name.");
        }
      });

    return () => {
      isActive = false;
    };
  }, [languageId]));

  const title = (language?.id === languageId ? language.name : undefined)
    ?? languageName ?? "단어 목록";

  return (
    <ScreenShell
      compact
      scrollable={false}
      title={isLoading ? title : `${title}(${words.length})`}
      headerContent={searchOpen ? (
        <SearchHeader value={search} onChange={setSearch} onCancel={() => {
          setSearchOpen(false);
          setSearch("");
          Keyboard.dismiss();
        }} />
      ) : undefined}
      headerLeft={
        <Link href="/" dismissTo asChild>
          <IconButton icon="menuHorizontal" accessibilityLabel="언어 목록 메뉴" />
        </Link>
      }
      headerRight={
        <View style={styles.headerActions}>
          <IconButton icon="search" accessibilityLabel="검색 열기"
            onPress={() => {
              setSortMenuOpen(false);
              setSearchOpen(true);
            }} />
          <Link push href={{ pathname: "/add-word", params: { languageId } } as Href} asChild>
            <IconButton icon="plus" accessibilityLabel="단어 추가" />
          </Link>
        </View>
      }
      toolbar={
        <View style={styles.toolbar}>
          <Pressable accessibilityRole="switch" accessibilityLabel="뜻 표시"
            accessibilityState={{ checked: showMeanings }}
            onPress={() => setShowMeanings((previous) => !previous)}
            style={({ pressed }) => [styles.meaningToggle, pressed && styles.menuButtonPressed]}>
            <Text style={styles.meaningToggleText}>{showMeanings ? "뜻 숨기기" : "뜻 보기"}</Text>
          </Pressable>
          <WordSortDropdown value={sort.order} onChange={selectSort}
            open={sortMenuOpen} onOpenChange={setSortMenuOpen} />
        </View>
      }
    >
      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator />
          <Text style={styles.stateText}>Loading list...</Text>
        </View>
      ) : null}

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      {!isLoading && !errorMessage && words.length === 0 ? (
        <Text style={styles.stateText}>No items found in this language.</Text>
      ) : null}
      {!isLoading && !errorMessage && words.length > 0 && visibleWords.length === 0 ? (
        <Text style={styles.stateText}>검색 결과가 없습니다.</Text>
      ) : null}

      <FlatList
        ref={list}
        onLayout={(event) => setListHeight(event.nativeEvent.layout.height)}
        ListFooterComponent={<View style={{ height: listHeight }} />}
        onScrollToIndexFailed={onScrollToIndexFailed}
        data={visibleWords}
        extraData={{ showMeanings, highlight }}
        keyExtractor={(word) => word.id}
        initialNumToRender={16}
        maxToRenderPerBatch={12}
        windowSize={5}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        renderItem={({ item: word }) => (
        <WordListItem
          key={word.id}
          label={word.word}
          meaning={word.meaning}
          showMeaning={showMeanings}
          highlightSequence={highlight?.id === word.id ? highlight.sequence : 0}
          onHighlightComplete={onHighlightComplete}
          onPress={() => router.push({
            pathname: "/[wordId]",
            params: { wordId: word.id, languageId },
          } as Href)}
          onEdit={() => router.push({
            pathname: "/[wordId]/edit",
            params: { wordId: word.id, languageId },
          } as Href)}
        />
        )}
      />
      {!isLoading && !errorMessage && words.length > 0 ? <Pressable accessibilityRole="button"
        onPress={() => { setSortMenuOpen(false); Keyboard.dismiss(); setTestDialogOpen(true); }} style={styles.testButton}>
        <Text style={styles.testLabel}>카드 테스트</Text>
      </Pressable> : null}
      {testDialogOpen ? <CardTestDialog available={words.length} onClose={() => setTestDialogOpen(false)}
        onStart={(count, selection) => {
          setTestDialogOpen(false);
          router.push({ pathname: "/card-test", params: { languageId, count: String(count), selection } } as Href);
        }} /> : null}
    </ScreenShell>
  );
}

function SearchHeader({ value, onChange, onCancel }: {
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
}) {
  const progress = useAnimatedValue(0);
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!width) return;
    const animation = Animated.timing(progress, { toValue: 1, duration: 220, useNativeDriver: false });
    animation.start(({ finished }) => { if (finished) input.current?.focus(); });
    return () => animation.stop();
  }, [progress, width]);

  return (
    <View style={styles.searchHeader}>
      <View style={styles.searchSlot} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        <Animated.View style={[styles.searchBox, {
          width: progress.interpolate({ inputRange: [0, 1], outputRange: [44, Math.max(44, width)] }),
        }]}>
          <TextInput ref={input} value={value} onChangeText={onChange}
            placeholder="단어·뜻 검색" accessibilityLabel="단어와 뜻 검색"
            placeholderTextColor={Palette.gray50} autoCapitalize="none" autoCorrect={false}
            returnKeyType="search" style={styles.searchInput} />
          {value.length > 0 ? (
            <Pressable accessibilityRole="button" accessibilityLabel="검색어 지우기"
              onPress={() => onChange("")} style={styles.clearButton}>
              <Text style={styles.clearText}>×</Text>
            </Pressable>
          ) : null}
          <Image source={WordnoteIcons.search} style={styles.searchIcon} contentFit="contain" />
        </Animated.View>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="검색 취소" onPress={onCancel}
        style={({ pressed }) => [styles.actionButton, pressed && styles.menuButtonPressed]}>
        <Text style={styles.cancelText}>취소</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  testButton: { position: "absolute", left: 10, right: 10, bottom: 26, minHeight: 56, borderRadius: 32,
    justifyContent: "center", alignItems: "center", backgroundColor: Palette.main, boxShadow: "2px 2px 4px rgba(0,0,0,0.2)" },
  testLabel: { color: Palette.white, fontFamily: Fonts.sans, fontSize: FontSizes.title, fontWeight: "700" },
  toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, },
  meaningToggle: { minHeight: 44, justifyContent: "center", paddingHorizontal: 8, borderRadius: 12 },
  meaningToggleText: { fontFamily: Fonts.sans, fontSize: FontSizes.body, color: Palette.gray60 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  searchHeader: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 4 },
  searchSlot: { flex: 1, height: 44, alignItems: "flex-end" },
  searchBox: { height: 44, flexDirection: "row", alignItems: "center", overflow: "hidden", backgroundColor: Palette.white, borderWidth: 1, borderColor: Palette.gray20, borderRadius: 24, paddingHorizontal: 8},
  searchIcon: { width: 36, height: 36, marginRight: 3 },
  cancelText: { fontFamily: Fonts.sans, fontSize: FontSizes.body, color: Palette.text },
  searchInput: { flex: 1, minWidth: 0, paddingHorizontal: 6, paddingVertical: 10, fontFamily: Fonts.sans, fontSize: FontSizes.small, color: Palette.text },
  clearButton: { width: 32, minHeight: 44, alignItems: "center", justifyContent: "center" },
  clearText: { fontSize: FontSizes.wordLabel, color: Palette.gray60 },
  actionButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22 },
  menuButtonPressed: {
    backgroundColor: Palette.gray10,
  },
  centerState: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 24,
  },
  errorText: {
    color: Palette.error,
    fontFamily: Fonts.sans, fontSize: FontSizes.small,
    lineHeight: 20,
  },
  stateText: {
    color: Palette.gray60,
    fontFamily: Fonts.sans, fontSize: FontSizes.body,
    lineHeight: 22,
  },
});
