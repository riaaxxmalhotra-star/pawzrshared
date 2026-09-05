import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { colors } from './colors';
import { typography } from './typography';
import { spacing, borderRadius, shadows, layout } from './spacing';

// Shared button styles
export const buttonStyles = StyleSheet.create({
  // Base button
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    gap: spacing.sm,
  },

  // Primary button (filled)
  primary: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  primaryText: {
    ...typography.buttonMedium,
    color: colors.white,
  },

  // Secondary button (outlined)
  secondary: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.xxl - 2,
  },
  secondaryText: {
    ...typography.buttonMedium,
    color: colors.primary,
  },

  // Ghost button (text only)
  ghost: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  ghostText: {
    ...typography.buttonMedium,
    color: colors.primary,
  },

  // Disabled state
  disabled: {
    opacity: 0.5,
  },

  // Size variants
  small: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  large: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxxl,
  },

  // Full width
  fullWidth: {
    width: '100%',
  },
});

// Shared card styles
export const cardStyles = StyleSheet.create({
  base: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  padded: {
    padding: spacing.lg,
  },
  paddedLarge: {
    padding: spacing.xl,
  },
  interactive: {
    ...shadows.md,
  },
});

// Shared input styles
export const inputStyles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    ...typography.captionBold,
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.input,
    minHeight: layout.inputHeight,
  },
  inputFocused: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  inputError: {
    borderWidth: 2,
    borderColor: colors.error,
    backgroundColor: colors.errorLight,
  },
  errorText: {
    ...typography.small,
    color: colors.error,
    marginTop: spacing.xs,
  },
  helperText: {
    ...typography.small,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
});

// Shared avatar styles
export const avatarStyles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  xs: {
    width: layout.avatarXs,
    height: layout.avatarXs,
  },
  sm: {
    width: layout.avatarSm,
    height: layout.avatarSm,
  },
  md: {
    width: layout.avatarMd,
    height: layout.avatarMd,
  },
  lg: {
    width: layout.avatarLg,
    height: layout.avatarLg,
  },
  xl: {
    width: layout.avatarXl,
    height: layout.avatarXl,
  },
  xxl: {
    width: layout.avatarXxl,
    height: layout.avatarXxl,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    ...typography.h3,
    color: colors.primary,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },
});

// Shared badge styles
export const badgeStyles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  primary: {
    backgroundColor: `${colors.primary}15`,
  },
  primaryText: {
    ...typography.small,
    color: colors.primary,
  },
  success: {
    backgroundColor: colors.successLight,
  },
  successText: {
    ...typography.small,
    color: colors.success,
  },
  error: {
    backgroundColor: colors.errorLight,
  },
  errorText: {
    ...typography.small,
    color: colors.error,
  },
  warning: {
    backgroundColor: colors.warningLight,
  },
  warningText: {
    ...typography.small,
    color: colors.warning,
  },
  info: {
    backgroundColor: colors.infoLight,
  },
  infoText: {
    ...typography.small,
    color: colors.info,
  },
  gray: {
    backgroundColor: colors.gray[100],
  },
  grayText: {
    ...typography.small,
    color: colors.gray[600],
  },
});

// Shared list item styles
export const listItemStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
    gap: spacing.md,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.bodySemibold,
  },
  subtitle: {
    ...typography.caption,
    color: colors.gray[500],
  },
  chevron: {
    color: colors.gray[400],
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[100],
    marginLeft: spacing.lg,
  },
});

// Shared empty state styles
export const emptyStateStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.xxxxl,
  },
  icon: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    color: colors.gray[500],
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
});

// Shared header styles
export const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    minHeight: layout.headerHeight,
  },
  title: {
    ...typography.h2,
  },
  backButton: {
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },
  actionButton: {
    padding: spacing.sm,
    marginRight: -spacing.sm,
  },
});

// Shared section styles
export const sectionStyles = StyleSheet.create({
  container: {
    marginBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
  },
  seeAll: {
    ...typography.buttonSmall,
    color: colors.primary,
  },
});
