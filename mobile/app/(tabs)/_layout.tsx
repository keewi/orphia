import { Tabs } from "expo-router";
import { colors } from "@/lib/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontFamily: "PlayfairDisplay_700Bold" },
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarLabel: "Home",
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: "Browse",
          tabBarLabel: "Browse",
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "Add",
          tabBarLabel: "Add",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: "Friends",
          tabBarLabel: "Friends",
        }}
      />
    </Tabs>
  );
}
