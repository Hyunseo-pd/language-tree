import { useLocalSearchParams } from "expo-router";
import { WordEditor } from "@/components/WordEditor";

export default function WordEditScreen() {
  const { wordId, languageId } = useLocalSearchParams<{ wordId: string; languageId?: string }>();
  return <WordEditor key={`${languageId}/${wordId}`} wordId={wordId} languageId={languageId} />;
}
