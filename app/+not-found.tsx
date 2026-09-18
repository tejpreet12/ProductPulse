import { ms } from "@/lib/scaling-units";
import { COLORS } from "@/theme";
import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not found" }} />
      <View style={styles.container}>
        <Text style={styles.title}>We couldn&apos;t find that page.</Text>
        <Link href="/" style={styles.link} accessibilityRole="link">
          Go back to Products
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: ms(24),
    gap: ms(12),
    backgroundColor: COLORS.white,
  },
  title: {
    fontSize: ms(16),
    fontWeight: "600",
    color: COLORS.charcoal,
    textAlign: "center",
  },
  link: { fontSize: ms(14), fontWeight: "700", color: "#1F6FEB" },
});
