import { View, Text, StyleSheet } from "react-native";
import { colors, fonts, fontSize } from "@/lib/theme";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ORPHEA</Text>
      <Text style={styles.subtitle}>Your VIP theatre companion</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontFamily: fonts.displayHeavy,
    fontSize: fontSize["4xl"],
    color: colors.gold,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: fontSize.lg,
    color: colors.textSecondary,
  },
});
