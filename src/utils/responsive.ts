import { Dimensions, Platform, ScaledSize } from 'react-native';

// Get initial dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface WindowDims {
  width: number;
  height: number;
}

// Device type detection. Accepts optional dimensions so callers using
// useWindowDimensions() re-render on rotation — the module-level snapshot
// above freezes at launch. Landscape phones are NOT tablets: only the
// smallest-side >= 600dp rule applies (the old aspect-ratio clause wrongly
// classified every landscape phone as a tablet).
export const isTablet = (dims?: WindowDims): boolean => {
  const { width, height } = dims ?? { width: SCREEN_WIDTH, height: SCREEN_HEIGHT };
  return Math.min(width, height) >= 600;
};

export const isLargeTablet = (dims?: WindowDims): boolean => {
  const { width, height } = dims ?? { width: SCREEN_WIDTH, height: SCREEN_HEIGHT };
  return Math.min(width, height) >= 768;
};

// Breakpoints
export const BREAKPOINTS = {
  phone: 0,
  tablet: 600,
  largeTablet: 768,
  desktop: 1024,
} as const;

export type DeviceType = 'phone' | 'tablet' | 'largeTablet';

export const getDeviceType = (): DeviceType => {
  const minDimension = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT);
  if (minDimension >= BREAKPOINTS.largeTablet) return 'largeTablet';
  if (minDimension >= BREAKPOINTS.tablet) return 'tablet';
  return 'phone';
};

// Responsive scaling functions
export const scale = (size: number): number => {
  const baseWidth = 375; // iPhone X width as base
  const scaleFactor = SCREEN_WIDTH / baseWidth;
  // Limit scaling on tablets to prevent overly large elements
  const maxScale = isTablet() ? 1.3 : 2;
  return Math.round(size * Math.min(scaleFactor, maxScale));
};

export const verticalScale = (size: number): number => {
  const baseHeight = 812; // iPhone X height as base
  const scaleFactor = SCREEN_HEIGHT / baseHeight;
  const maxScale = isTablet() ? 1.2 : 2;
  return Math.round(size * Math.min(scaleFactor, maxScale));
};

export const moderateScale = (size: number, factor: number = 0.5): number => {
  return Math.round(size + (scale(size) - size) * factor);
};

// Layout helpers for cards and grids
export const getCardDimensions = () => {
  const device = getDeviceType();
  const padding = device === 'phone' ? 16 : 24;

  if (device === 'phone') {
    return {
      width: SCREEN_WIDTH - padding * 2,
      height: SCREEN_HEIGHT * 0.7,
      padding,
    };
  } else if (device === 'tablet') {
    // On tablet, limit card width for better UX
    const maxWidth = 500;
    return {
      width: Math.min(SCREEN_WIDTH - padding * 2, maxWidth),
      height: SCREEN_HEIGHT * 0.65,
      padding,
    };
  } else {
    // Large tablet
    const maxWidth = 550;
    return {
      width: Math.min(SCREEN_WIDTH - padding * 2, maxWidth),
      height: SCREEN_HEIGHT * 0.6,
      padding,
    };
  }
};

// Grid layout for browse screens
export const getGridColumns = (): number => {
  const device = getDeviceType();
  if (device === 'largeTablet') return 3;
  if (device === 'tablet') return 2;
  return 1;
};

// Tab bar dimensions
export const getTabBarHeight = (): number => {
  const device = getDeviceType();
  if (device === 'largeTablet') return 80;
  if (device === 'tablet') return 75;
  return Platform.OS === 'ios' ? 85 : 70;
};

export const getTabBarFontSize = (): number => {
  const device = getDeviceType();
  if (device === 'largeTablet') return 13;
  if (device === 'tablet') return 12;
  // 12sp minimum: 11sp tab labels fail WCAG contrast/size guidance.
  return 12;
};

// Font scaling with limits for tablet
export const getFontSize = (baseSize: number): number => {
  if (isTablet()) {
    // Scale up slightly but not too much on tablets
    return Math.round(baseSize * 1.1);
  }
  return baseSize;
};

// Spacing that adapts to device
export const getSpacing = (baseSpacing: number): number => {
  if (isLargeTablet()) return Math.round(baseSpacing * 1.3);
  if (isTablet()) return Math.round(baseSpacing * 1.15);
  return baseSpacing;
};

// Hook-friendly dimension getter (use with useWindowDimensions for reactivity)
export const getResponsiveValue = <T>(
  dimensions: ScaledSize,
  values: { phone: T; tablet?: T; largeTablet?: T }
): T => {
  const minDimension = Math.min(dimensions.width, dimensions.height);

  if (minDimension >= BREAKPOINTS.largeTablet && values.largeTablet !== undefined) {
    return values.largeTablet;
  }
  if (minDimension >= BREAKPOINTS.tablet && values.tablet !== undefined) {
    return values.tablet;
  }
  return values.phone;
};

// Export screen dimensions for convenience
export { SCREEN_WIDTH, SCREEN_HEIGHT };
