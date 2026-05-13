import { View, Text, StyleSheet } from "react-native";
import { colors, fonts, fontSize } from "@/lib/theme";

export default function FriendsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Friends coming soon</Text>
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
  placeholder: {
    fontFamily: fonts.body,
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
});
