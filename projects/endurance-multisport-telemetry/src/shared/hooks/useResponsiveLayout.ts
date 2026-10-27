import { useWindowDimensions } from 'react-native';

export type ResponsiveSize = 'compact' | 'medium';

export interface ResponsiveLayout {
  size: ResponsiveSize;
  isLandscape: boolean;
  columns: number;
}

const MEDIUM_BREAKPOINT = 600;

export function useResponsiveLayout(): ResponsiveLayout {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const size: ResponsiveSize = width >= MEDIUM_BREAKPOINT || isLandscape ? 'medium' : 'compact';
  const columns = size === 'compact' ? 1 : width >= 900 ? 3 : 2;

  return { size, isLandscape, columns };
}
