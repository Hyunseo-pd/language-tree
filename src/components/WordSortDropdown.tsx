import { DropdownMenu, type DropdownMenuProps } from "@/components/ui/DropdownMenu";
import type { WordSortOrder } from "@/lib/wordSort";

const options = [
  { value: "alphabetical", label: "알파벳순" },
  { value: "date", label: "날짜순 (최신순)" },
  { value: "random", label: "랜덤" },
] as const;

export function WordSortDropdown(props: Omit<DropdownMenuProps<WordSortOrder>, "label" | "options">) {
  return <DropdownMenu label="정렬" options={options} {...props} />;
}
