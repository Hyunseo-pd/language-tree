import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export const unstable_settings = {
  initialRouteName: "index",
};

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          animationTypeForReplace: "pop",
          gestureEnabled: true,
          contentStyle: { backgroundColor: "#ffffff" },
        }}
      />
    </GestureHandlerRootView>
  );
}