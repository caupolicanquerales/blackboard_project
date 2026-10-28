export type SeverityLevel = 'URGENT' | 'HIGH' | 'MEDIUM' | 'ROUTINE';

export interface SeverityColor {
  background: string;
  foreground: string;
  border: string;
  label: string;
  icon: string;
}

export const theme = {
  mode: 'light' as const,
  headingStyle: 'clear, high-contrast, bold hierarchy',
  iconography: 'custom icons for appointment types, pharmacy dispatches and financial receipts',
  colors: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceAlt: '#F1F5F9',
    border: '#CBD5E1',
    accent: '#0284C7',
    accentStrong: '#075985',
    onAccent: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#334155',
    textMuted: '#475569',
    error: '#B91C1C',
    status: {
      confirmed: '#10B981',
      priority: '#F59E0B',
      urgent: '#EF4444',
    },
    statusText: {
      confirmed: '#065F46',
      priority: '#92400E',
      urgent: '#991B1B',
    },
    statusSurface: {
      confirmed: '#ECFDF5',
      priority: '#FFFBEB',
      urgent: '#FEF2F2',
    },
  },
  spacing: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
  },
  radii: {
    sm: 6,
    md: 10,
    lg: 16,
    pill: 999,
  },
  typography: {
    h1: { fontSize: 28, lineHeight: 34, fontWeight: '800' as const },
    h2: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const },
    h3: { fontSize: 18, lineHeight: 24, fontWeight: '700' as const },
    body: { fontSize: 16, lineHeight: 22, fontWeight: '400' as const },
    bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
    caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
  },
  minTouchTarget: 44,
  icons: {
    appointment: {
      default: '📅',
      consultation: '🩺',
      telemedicine: '💻',
      followUp: '🔁',
      lab: '🧪',
      imaging: '🩻',
      surgery: '🏥',
    },
    pharmacy: {
      default: '💊',
      dispatch: '🚚',
      pickup: '🏪',
      delivered: '📦',
      refill: '🔄',
    },
    receipt: {
      default: '🧾',
      payment: '💳',
      insurance: '🛡️',
      invoice: '📄',
      refund: '↩️',
    },
  },
};

export type Theme = typeof theme;

const severityMap: Record<SeverityLevel, SeverityColor> = {
  URGENT: {
    background: theme.colors.statusSurface.urgent,
    foreground: theme.colors.statusText.urgent,
    border: theme.colors.status.urgent,
    label: 'Urgent',
    icon: '🚨',
  },
  HIGH: {
    background: theme.colors.statusSurface.priority,
    foreground: theme.colors.statusText.priority,
    border: theme.colors.status.priority,
    label: 'High priority',
    icon: '⚠️',
  },
  MEDIUM: {
    background: '#E0F2FE',
    foreground: theme.colors.accentStrong,
    border: theme.colors.accent,
    label: 'Medium',
    icon: 'ℹ️',
  },
  ROUTINE: {
    background: theme.colors.surfaceAlt,
    foreground: theme.colors.textSecondary,
    border: theme.colors.border,
    label: 'Routine',
    icon: '✔️',
  },
};

export function severityColor(level: string | null | undefined): SeverityColor {
  const key = String(level ?? '').toUpperCase() as SeverityLevel;
  return severityMap[key] ?? severityMap.ROUTINE;
}

export function appointmentIcon(type?: string): string {
  const icons = theme.icons.appointment as Record<string, string>;
  return icons[type ?? ''] ?? icons.default;
}

export function pharmacyIcon(type?: string): string {
  const icons = theme.icons.pharmacy as Record<string, string>;
  return icons[type ?? ''] ?? icons.default;
}

export function receiptIcon(type?: string): string {
  const icons = theme.icons.receipt as Record<string, string>;
  return icons[type ?? ''] ?? icons.default;
}

export default theme;
