export const colors = {
  // Brand colors
  primary: '#F97316', // Orange
  primaryDark: '#EA580C',
  primaryLight: '#FDBA74',
  secondary: '#FED7AA',

  // Base colors
  background: '#FFFBF5',
  white: '#FFFFFF',
  black: '#000000',

  // Gray scale
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Semantic colors
  error: '#EF4444',
  errorLight: '#FEE2E2',
  success: '#22C55E',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
};

// Role-based colors for different user types
export const roleColors = {
  OWNER: '#F97316',   // Orange - Pet Owners
  LOVER: '#F97316',   // Orange - Pet Lovers
  VET: '#10B981',     // Emerald - Veterinarians
  GROOMER: '#8B5CF6', // Violet - Groomers
  SUPPLIER: '#3B82F6', // Blue - Suppliers
  CAFE: '#14B8A6',    // Teal - Pet Cafes
};

// Get color for a specific role
export const getRoleColor = (role: string): string => {
  const upperRole = role?.toUpperCase() || 'OWNER';
  return roleColors[upperRole as keyof typeof roleColors] || colors.primary;
};

// Get light variant of role color (for backgrounds)
export const getRoleLightColor = (role: string): string => {
  const color = getRoleColor(role);
  return `${color}15`; // 15% opacity
};
