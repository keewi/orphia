/**
 * ORPHEA color palette — matches web app's globals.css design system
 */
export const colors = {
  // Core backgrounds
  bg: "#0F0E12",
  bgCard: "#1A1820",
  bgCardHover: "#23212B",
  surface: "#2A2833",

  // Gold / accent
  gold: "#F4C542",
  goldDim: "#C8922A",
  goldBright: "#FFD700",

  // Text
  textPrimary: "#F5F0E8",
  textSecondary: "#A09888",
  textMuted: "#706858",

  // Status
  success: "#4CAF50",
  error: "#E57373",
  warning: "#FFB74D",

  // Borders
  border: "#2A2833",
  borderLight: "#3A3848",

  // Stars
  starFilled: "#F4C542",
  starEmpty: "#3A3848",
} as const;

export type ColorKey = keyof typeof colors;
