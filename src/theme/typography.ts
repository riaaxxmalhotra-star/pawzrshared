import { TextStyle, Platform } from 'react-native';
import { colors } from './colors';

// Font weights mapping for cross-platform consistency
const fontWeights = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
  extrabold: '800' as TextStyle['fontWeight'],
};

// Base typography styles
export const typography = {
  // Display - Large hero text
  display: {
    fontSize: 36,
    fontWeight: fontWeights.extrabold,
    lineHeight: 44,
    letterSpacing: -0.5,
    color: colors.gray[900],
  } as TextStyle,

  // Headings
  h1: {
    fontSize: 28,
    fontWeight: fontWeights.bold,
    lineHeight: 34,
    letterSpacing: -0.3,
    color: colors.gray[900],
  } as TextStyle,

  h2: {
    fontSize: 22,
    fontWeight: fontWeights.bold,
    lineHeight: 28,
    letterSpacing: -0.2,
    color: colors.gray[900],
  } as TextStyle,

  h3: {
    fontSize: 18,
    fontWeight: fontWeights.bold,
    lineHeight: 24,
    color: colors.gray[900],
  } as TextStyle,

  h4: {
    fontSize: 16,
    fontWeight: fontWeights.semibold,
    lineHeight: 22,
    color: colors.gray[900],
  } as TextStyle,

  // Body text
  body: {
    fontSize: 15,
    fontWeight: fontWeights.regular,
    lineHeight: 22,
    color: colors.gray[700],
  } as TextStyle,

  bodyMedium: {
    fontSize: 15,
    fontWeight: fontWeights.medium,
    lineHeight: 22,
    color: colors.gray[700],
  } as TextStyle,

  bodySemibold: {
    fontSize: 15,
    fontWeight: fontWeights.semibold,
    lineHeight: 22,
    color: colors.gray[900],
  } as TextStyle,

  bodySmall: {
    fontSize: 14,
    fontWeight: fontWeights.regular,
    lineHeight: 20,
    color: colors.gray[600],
  } as TextStyle,

  // Caption/Small text
  caption: {
    fontSize: 13,
    fontWeight: fontWeights.medium,
    lineHeight: 18,
    color: colors.gray[500],
  } as TextStyle,

  captionBold: {
    fontSize: 13,
    fontWeight: fontWeights.semibold,
    lineHeight: 18,
    color: colors.gray[600],
  } as TextStyle,

  // Extra small text
  small: {
    fontSize: 12,
    fontWeight: fontWeights.semibold,
    lineHeight: 16,
    color: colors.gray[500],
  } as TextStyle,

  tiny: {
    fontSize: 11,
    fontWeight: fontWeights.medium,
    lineHeight: 14,
    color: colors.gray[400],
  } as TextStyle,

  // Button text
  buttonLarge: {
    fontSize: 16,
    fontWeight: fontWeights.semibold,
    lineHeight: 22,
    letterSpacing: 0.2,
  } as TextStyle,

  buttonMedium: {
    fontSize: 15,
    fontWeight: fontWeights.semibold,
    lineHeight: 20,
    letterSpacing: 0.1,
  } as TextStyle,

  buttonSmall: {
    fontSize: 13,
    fontWeight: fontWeights.semibold,
    lineHeight: 18,
  } as TextStyle,

  // Label text
  label: {
    fontSize: 14,
    fontWeight: fontWeights.semibold,
    lineHeight: 18,
    color: colors.gray[700],
    textTransform: 'uppercase' as TextStyle['textTransform'],
    letterSpacing: 0.5,
  } as TextStyle,

  // Input text
  input: {
    fontSize: 15,
    fontWeight: fontWeights.regular,
    lineHeight: 20,
    color: colors.gray[900],
  } as TextStyle,

  inputPlaceholder: {
    fontSize: 15,
    fontWeight: fontWeights.regular,
    lineHeight: 20,
    color: colors.gray[400],
  } as TextStyle,

  // Link text
  link: {
    fontSize: 15,
    fontWeight: fontWeights.medium,
    lineHeight: 22,
    color: colors.primary,
  } as TextStyle,
};

// Font weight utilities
export { fontWeights };
