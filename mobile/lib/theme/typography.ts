export const fonts = {
  display: "PlayfairDisplay-Bold",
  body: "Inter-Regular",
  bodyMedium: "Inter-Medium",
  bodySemiBold: "Inter-SemiBold",
} as const;

export const fontSize = {
  xs: 12, sm: 14, base: 16, md: 16, lg: 18, xl: 20,
  "2xl": 24, "3xl": 30, "4xl": 36,
} as const;

/** Convenience aliases used by screens */
export const typography = {
  families: {
    heading: fonts.display,
    body: fonts.body,
    bodyMedium: fonts.bodyMedium,
    bodySemiBold: fonts.bodySemiBold,
  },
  sizes: fontSize,
} as const;
