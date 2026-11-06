import { FolderNameDialog } from "@/components/FolderNameDialog";
import { DropdownMenu, type DropdownOption } from "@/components/ui/DropdownMenu";
import { Fonts, FontSizes, Palette } from "@/constants/theme";
import { useState } from "react";
import { Pressable, type PressableProps, StyleSheet, Text, View } from "react-native";

type FolderProps = PressableProps & {
  label: string;
  wordCount?: number;
  onRename?: () => void;
  onDelete?: () => Promise<void>;
};

export function Folder({ label, wordCount, style, onRename, onDelete, disabled, ...props }: FolderProps) {
  const [open, setOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const options: DropdownOption<"rename" | "delete">[] = [];
  if (onRename) options.push({ value: "rename", label: "이름 편집" });
  if (onDelete) options.push({ value: "delete", label: "삭제", destructive: true });

  function selectAction(action: "rename" | "delete") {
    if (action === "rename") onRename?.();
    else setConfirmingDelete(true);
  }

  return (
    <View>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" disabled={disabled}
          style={(state) => [styles.button, state.pressed && styles.pressed,
            typeof style === "function" ? style(state) : style]} {...props}>
          <Text style={styles.label}>{label}</Text>
          {wordCount !== undefined && <Text style={styles.wordCount}>{wordCount}</Text>}
        </Pressable>
        {options.length > 0 && <DropdownMenu label={`${label} 폴더 메뉴`} icon="menuVertical"
          options={options} onChange={selectAction} open={open} onOpenChange={setOpen}
          disabled={Boolean(disabled)} />}
      </View>
      {confirmingDelete && onDelete && <FolderNameDialog mode="delete"
        title="폴더 삭제" initialName={label} onClose={() => setConfirmingDelete(false)}
        onSave={async () => { await onDelete(); }} /> }
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderColor: Palette.gray20, paddingRight: 0 },
  button: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, minHeight: 52, paddingHorizontal: 8 },
  pressed: { opacity: 0.72 },
  label: { flexShrink: 1, color: Palette.text, fontSize: 24, fontWeight: "400" },
  wordCount: { color: Palette.gray60, fontFamily: Fonts.sans, fontSize: FontSizes.body, fontWeight: "400" },
});
