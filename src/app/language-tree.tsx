import { ScreenShell } from "@/components/ScreenShell";
import { IconButton } from "@/components/ui/IconButton";
import { router } from "expo-router";

export default function LanguageTreeScreen() {
  return (
    <ScreenShell
      title=""
      scrollable={false}
      headerLeft={
        <IconButton
          icon="back"
          accessibilityLabel="뒤로가기"
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/");
          }}
        />
      }
    />
  );
}
