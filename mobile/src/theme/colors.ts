export const colors = {
  // Backgrounds
  background: '#f4f8fc',
  surface: '#ffffff',
  surfaceAlt: '#eef5ff',
  surfaceElevated: '#ffffff',

  // Brand
  primary: '#2c73d9',
  primaryDark: '#1a5bb8',
  primarySoft: '#dcecff',
  primaryGlow: '#4a90e8',
  accent: '#4ebd95',
  accentSoft: '#dff4ea',
  accentDark: '#3a9975',

  // Semantic
  success: '#2cb67d',
  successSoft: '#d4f5e5',
  warning: '#d68d2f',
  warningSoft: '#fcf0dc',
  danger: '#c95555',
  dangerSoft: '#fde0e0',
  info: '#5b8fd9',
  infoSoft: '#e3eefa',

  // Text
  text: '#17324a',
  textSecondary: '#3d5a7a',
  textMuted: '#5d738b',
  textInverse: '#ffffff',

  // Borders
  border: '#d7e3f0',
  borderLight: '#e8f0fa',
  borderFocus: '#2c73d9',

  // Special
  gold: '#e8b730',
  goldSoft: '#fdf3d6',
  purple: '#7c5cbf',
  purpleSoft: '#ede4fa',
  pink: '#d94e8f',
  pinkSoft: '#fce4f0',

  // Gradients (use with LinearGradient)
  gradientPrimary: ['#2c73d9', '#4a90e8'] as const,
  gradientAccent: ['#4ebd95', '#6dd5ab'] as const,
  gradientPurple: ['#7c5cbf', '#9b7ed8'] as const,
  gradientSunset: ['#d94e8f', '#e8b730'] as const,
  gradientHero: ['#dff0ff', '#eef9ff', '#f7fcff'] as const,
  gradientCard: ['#ffffff', '#f8fbff'] as const,
  gradientDark: ['#17324a', '#2c4a6a'] as const,

  // Overlays
  overlay: 'rgba(23, 50, 74, 0.5)',
  overlayLight: 'rgba(23, 50, 74, 0.15)',

  // Shadows (for style objects)
  shadow: '#17324a',
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
}

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  full: 999,
}

export const typography = {
  hero: { fontSize: 32, fontWeight: '800' as const, lineHeight: 40, letterSpacing: -0.5 },
  h1: { fontSize: 26, fontWeight: '800' as const, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 30 },
  h3: { fontSize: 18, fontWeight: '700' as const, lineHeight: 26 },
  h4: { fontSize: 16, fontWeight: '700' as const, lineHeight: 22 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodyBold: { fontSize: 15, fontWeight: '700' as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '600' as const, lineHeight: 18 },
  small: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
  tiny: { fontSize: 11, fontWeight: '600' as const, lineHeight: 14 },
}

export const shadows = {
  sm: {
    shadowColor: '#17324a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#17324a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#17324a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  }),
}
