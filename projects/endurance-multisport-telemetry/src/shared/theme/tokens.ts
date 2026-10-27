export const theme = {
  mode: 'dark',
  headingStyleDescription: 'bold italic uppercase athletic headers',
  iconography: 'native vector icons (heart, lightning, pedal/runner)',
  colors: {
    background: '#121212',
    surface: '#1E1E1E',
    surfaceElevated: '#2A2A2A',
    border: '#3A3A3C',
    accent: '#FF3B30',
    onAccent: '#FFFFFF',
    text: '#FFFFFF',
    muted: '#A1A1A6',
    success: '#30D158',
    warning: '#FFD60A',
    error: '#FF6B61',
  },
  spacing: {
    xxs: 4,
    xs: 6,
    sm: 8,
    md: 12,
    lg: 16,
  },
  radii: {
    sm: 6,
    md: 12,
    lg: 20,
    pill: 999,
  },
  minTouchTarget: 44,
  typography: {
    headingStyle: {
      fontWeight: '800',
      fontStyle: 'italic',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    fontSizes: {
      caption: 12,
      body: 16,
      subtitle: 18,
      heading: 24,
      display: 36,
    },
    body: {
      fontWeight: '400',
    },
  },
} as const;

export type Theme = typeof theme;
