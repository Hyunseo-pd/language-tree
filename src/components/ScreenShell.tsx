import { Palette, Fonts, FontSizes } from "@/constants/theme";
import { PropsWithChildren, type ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ScreenShellProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  toolbar?: ReactNode;
}>;

export function ScreenShell({ title, subtitle, headerLeft, headerRight, toolbar, children }: ScreenShellProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          {headerLeft || headerRight ? (
            <View style={styles.headerRow}>
              <View style={styles.headerSide}>{headerLeft}</View>
              <Text style={[styles.title, styles.centeredTitle]} numberOfLines={1}>
                {title}
              </Text>
              <View style={styles.headerSide}>{headerRight}</View>
            </View>
          ) : <Text style={styles.title}>{title}</Text>}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {toolbar ? <View style={styles.toolbar}>{toolbar}</View> : null}
        <ScrollView
          style={styles.scroller}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {children}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  toolbar: { marginBottom: 16 },
  safeArea: {
    flex: 1,
    backgroundColor: Palette.white,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    gap: 8,
    marginBottom: 28,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 48,
  },
  headerSide: {
    minWidth: 48,
  },
  centeredTitle: {
    flex: 1,
    textAlign: "center",
  },
  title: {
    color: Palette.textStrong,
    fontFamily: Fonts.sans, fontSize: FontSizes.title,
    fontWeight: "700",
  },
  subtitle: {
    color: Palette.textMuted,
    fontFamily: Fonts.sans, fontSize: FontSizes.body,
  },
  scroller: {
    flex: 1,
  },
  content: {
    gap: 12,
    paddingBottom: 24,
  },
});
