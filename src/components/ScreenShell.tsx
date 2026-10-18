import { PropsWithChildren, type ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ScreenShellProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  headerLeft?: ReactNode;
}>;

export function ScreenShell({ title, subtitle, headerLeft, children }: ScreenShellProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          {headerLeft ? (
            <View style={styles.headerRow}>
              <View style={styles.headerSide}>{headerLeft}</View>
              <Text style={[styles.title, styles.centeredTitle]} numberOfLines={1}>
                {title}
              </Text>
              <View style={styles.headerSide} />
            </View>
          ) : <Text style={styles.title}>{title}</Text>}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <ScrollView
          style={styles.scroller}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
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
    width: 48,
  },
  centeredTitle: {
    flex: 1,
    textAlign: "center",
  },
  title: {
    color: "#111111",
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: "#666666",
    fontSize: 16,
  },
  scroller: {
    flex: 1,
  },
  content: {
    gap: 12,
    paddingBottom: 24,
  },
});
