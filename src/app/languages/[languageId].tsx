import { Palette, Fonts, FontSizes } from "@/constants/theme";
import { WordSortDropdown } from "@/components/WordSortDropdown";
import { Image } from "expo-image";
import { Link, router, useFocusEffect, useLocalSearchParams, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenShell } from "@/components/ScreenShell";
import { WordListItem } from "@/components/WordListItem";
import { getLanguageName, subscribeToWords, type WordItem } from "@/lib/languageStore";
import { selectWordSort, sortWords, useWordSort, type WordSortOrder } from "@/lib/wordSort";

export default function LanguageWordsScreen() {
  const { languageId, languageName } = useLocalSearchParams<{
    languageId: string;
    languageName?: string;
  }>();
  const [language, setLanguage] = useState<{ id: string; name: string } | null>(null);
  const sort = useWordSort(languageId);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [words, setWords] = useState<WordItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      title={title}
      headerLeft={
        <Link href="/" dismissTo asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="언어 목록 메뉴"
            style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
          >
            <View style={styles.menuIcon}>
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
            </View>
          </Pressable>
        </Link>
      }
      headerRight={
        <View style={styles.headerActions}>
          <Pressable accessibilityRole="button" accessibilityLabel={searchOpen ? "검색 닫기" : "검색 열기"}
            accessibilityState={{ expanded: searchOpen }}
            onPress={() => {
              setSearchOpen(!searchOpen);
              if (searchOpen) {
                setSearch("");
                Keyboard.dismiss();
              }
            }}
            style={({ pressed }) => [styles.actionButton, (pressed || searchOpen) && styles.menuButtonPressed]}>
            <Image source={require("../../../assets/icons/wordnote/search.png")} style={styles.actionIcon} contentFit="contain" />
          </Pressable>
          <Link push href={{ pathname: "/add-word", params: { languageId } } as Href} asChild>
            <Pressable accessibilityRole="button" accessibilityLabel="단어 추가"
              style={({ pressed }) => [styles.actionButton, pressed && styles.menuButtonPressed]}>
              <Image source={require("../../../assets/icons/wordnote/plus.png")} style={styles.actionIcon} contentFit="contain" />
            </Pressable>
          </Link>
        </View>
      }
      toolbar={
        <View style={styles.toolbar}>
          <WordSortDropdown value={sort.order} onChange={selectSort}
            open={sortMenuOpen} onOpenChange={setSortMenuOpen} />
          {searchOpen ? <View style={styles.searchBox}>
            <TextInput
              autoFocus
              value={search}
              onChangeText={setSearch}
              placeholder="단어·뜻 검색"
              accessibilityLabel="단어와 뜻 검색"
              placeholderTextColor={Palette.placeholder}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              style={styles.searchInput}
            />
            {search.length > 0 ? (
              <Pressable accessibilityRole="button" accessibilityLabel="검색어 지우기"
                onPress={() => setSearch("")} style={styles.clearButton}>
                <Text style={styles.clearText}>×</Text>
              </Pressable>
            ) : null}
          </View> : null}
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

      {visibleWords.map((word) => (
        <WordListItem
          key={word.id}
          label={word.word}
          onPress={() => router.push({
            pathname: "/[wordId]",
            params: { wordId: word.id, languageId },
          } as Href)}
          onEdit={() => router.push({
            pathname: "/[wordId]/edit",
            params: { wordId: word.id, languageId },
          } as Href)}
        />
      ))}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  searchBox: { flex: 1, minWidth: 0, minHeight: 44, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: Palette.border, borderRadius: 24, paddingLeft: 8 },
  searchInput: { flex: 1, minWidth: 0, paddingHorizontal: 6, paddingVertical: 10, fontFamily: Fonts.sans, fontSize: FontSizes.small, color: Palette.text },
  clearButton: { width: 32, minHeight: 44, alignItems: "center", justifyContent: "center" },
  clearText: { fontSize: FontSizes.heading, color: Palette.textMuted },
  actionButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22 },
  actionIcon: { width: 36, height: 36 },
  menuButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  menuButtonPressed: {
    backgroundColor: Palette.surfacePressed,
  },
  menuIcon: {
    gap: 5,
  },
  menuLine: {
    width: 22,
    height: 2,
    borderRadius: 1,
    backgroundColor: Palette.textStrong,
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
    color: Palette.textMuted,
    fontFamily: Fonts.sans, fontSize: FontSizes.label,
    lineHeight: 22,
  },
});
