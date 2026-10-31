import { useLocalSearchParams } from "expo-router";
import { WordEditor } from "@/components/WordEditor";

export default function WordAddScreen() {
  const { languageId } = useLocalSearchParams<{ languageId?: string }>();
  return <WordEditor key={languageId} languageId={languageId} />;
}
