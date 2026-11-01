import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState, type RefObject } from "react";
import type { FlatList } from "react-native";
import type { WordItem } from "@/lib/languageStore";
import { clearCardReturn, getCardReturn } from "@/lib/wordListReturn";

export function useWordListReturn(languageId: string, words: WordItem[], list: RefObject<FlatList<WordItem> | null>, listHeight: number) {
  const [highlight, setHighlight] = useState<{ id: string; sequence: number } | null>(null);
  const retry = useRef<(() => void) | null>(null);
  const failed = useRef(false);

  useFocusEffect(useCallback(() => {
    const target = getCardReturn(languageId);
    if (!target || !listHeight) return;
    const index = words.findIndex((word) => word.id === target.id);
    if (index < 0) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    const scroll = () => {
      if (!list.current || attempts++ >= 12) return;
      failed.current = false;
      list.current.scrollToIndex({ index, viewPosition: 0, animated: false });
      if (!failed.current) {
        clearCardReturn(languageId, target.sequence);
        setHighlight(target);
      }
    };
    retry.current = () => { timer = setTimeout(scroll, 100); };
    const frame = requestAnimationFrame(scroll);
    return () => {
      cancelAnimationFrame(frame);
      if (timer) clearTimeout(timer);
      retry.current = null;
    };
  }, [languageId, words, list, listHeight]));

  const onScrollToIndexFailed = useCallback(({ index, averageItemLength }: { index: number; averageItemLength: number }) => {
    failed.current = true;
    list.current?.scrollToOffset({ offset: index * averageItemLength, animated: false });
    retry.current?.();
  }, [list]);

  const onHighlightComplete = useCallback((sequence: number) => {
    setHighlight((previous) => previous?.sequence === sequence ? null : previous);
  }, []);

  return { highlight, onScrollToIndexFailed, onHighlightComplete };
}
