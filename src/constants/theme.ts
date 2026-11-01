import '@/global.css';

import { Platform } from 'react-native';

// Shared fixed colors. Use Colors[scheme] / useTheme() for adaptive surfaces.
export const Palette = {
  white: '#FFFFFF', 
  background: '#FDFBF3', 
  text: '#000000', 
  icon: '#4C4C4C',
  secondary: '#8A8A8A', 
  accent: '#009552', textStrong: '#111111',
  textMuted: '#666666', textInput: '#17212F', textLabel: '#283445',
  textHint: '#6B7280', placeholder: '#9299A3', border: '#CCCCCC',
  borderSubtle: '#E5E5E5', borderInput: '#DCE1E7', surfaceInput: '#F8FAFC',
  surfaceMuted: '#F3F4F6', surfacePressed: '#EEEEEE',
  error: '#B00020', errorStrong: '#B42318', destructive: '#D64545',
  success: '#18734B', link: '#3C87F7',
} as const;

export const FontAssets = {
  Inter: require('../../assets/fonts/Inter/Inter.ttf'),
} as const;

export const FontSizes = {
  caption: 12, helper: 13, small: 14, label: 15, body: 16,
  input: 17, detail: 18, bodyLarge: 20, heading: 21, wordLabel: 22,
  title: 28, meaning: 30, display: 32, word: 45, hero: 48,
} as const;

export const Colors = {
  light: {
    text: Palette.text,
    background: Palette.background,
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: Palette.secondary,
    icon: Palette.icon,
    accent: Palette.accent,
    border: Palette.border,
    surface: Palette.white,
    error: Palette.error,
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    icon: '#D1D5DB',
    accent: '#57D99B',
    border: '#4C4C4C',
    surface: '#212225',
    error: '#FF8A9A',
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
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

// All app text uses the font loaded by the root layout; keep platform fallbacks
// available for specialized serif, rounded and monospace content.
export const Fonts = { ...SystemFonts, sans: 'Inter' } as const;

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
