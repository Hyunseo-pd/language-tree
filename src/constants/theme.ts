import '@/global.css';

import { Platform } from 'react-native';

// Shared fixed colors. Use Colors[scheme] / useTheme() for adaptive surfaces.
export const Palette = {
  white: '#FFFFFF', 
  background: '#FDFBF3', 
  text: '#000000', 
  gray70: '#424242',
  gray60: '#666666',
  gray50: '#8A8A8A', 
  gray20: '#D9D9D9',
  gray10: '#E5E5E5',
  error: '#B00020', errorStrong: '#B42318', destructive: '#D64545',
  success: '#18734B', link: '#3C87F7',
} as const;

export const FontAssets = {
  Castoro: require('../../assets/fonts/Castoro/Castoro.ttf'),
} as const;

export const FontSizes = {
  caption: 12, small: 14, body: 16, detail: 18, bodyLarge: 20,
  wordLabel: 22, title: 24, meaning: 30, display: 32, hero: 48,
} as const;

export const Colors = {
  light: {
    text: Palette.text,
    background: Palette.background,
    backgroundElement: Palette.gray10,
    backgroundSelected: Palette.gray20,
    textSecondary: Palette.gray50,
  },
  dark: {
    text: Palette.white,
    background: Palette.text,
    backgroundElement: Palette.gray70,
    backgroundSelected: Palette.gray70,
    textSecondary: Palette.gray50,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

const SystemFonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'sans-serif',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

// System UI font for general text; bundled Castoro for vocabulary words.
export const Fonts = { ...SystemFonts, word: 'Castoro' } as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
