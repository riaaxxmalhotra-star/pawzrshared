// Spacing scale (based on 4px grid)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
};

// Border radius scale
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  full: 9999, // For fully rounded (pills, circles)
};

// Shadow presets
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
};

// Screen padding presets
export const screenPadding = {
  horizontal: spacing.xl, // 20
  vertical: spacing.lg,   // 16
};

// Card padding presets
export const cardPadding = {
  sm: spacing.md,   // 12
  md: spacing.lg,   // 16
  lg: spacing.xl,   // 20
};

// Common layout measurements
export const layout = {
  // Header heights
  headerHeight: 56,
  tabBarHeight: 60,

  // Input heights
  inputHeight: 48,
  inputHeightSmall: 40,
  inputHeightLarge: 56,

  // Button heights
  buttonHeight: 48,
  buttonHeightSmall: 36,
  buttonHeightLarge: 56,

  // Avatar sizes
  avatarXs: 32,
  avatarSm: 40,
  avatarMd: 48,
  avatarLg: 64,
  avatarXl: 80,
  avatarXxl: 120,

  // Icon sizes
  iconXs: 16,
  iconSm: 20,
  iconMd: 24,
  iconLg: 28,
  iconXl: 32,

  // Card sizes
  cardBorderRadius: borderRadius.lg,

  // Gaps
  listItemGap: spacing.md,
  sectionGap: spacing.xxl,
};
