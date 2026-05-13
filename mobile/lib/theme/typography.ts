/**
 * ORPHEA typography — Playfair Display (headings) + Inter (body)
 * Fonts loaded via @expo-google-fonts in the root layout.
 */
export const fonts = {
  display: "PlayfairDisplay_700Bold",
  displayHeavy: "PlayfairDisplay_800ExtraBold",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemiBold: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
} as const;
