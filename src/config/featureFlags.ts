// Feature Flags Configuration
// Set to true to show feature in UI, false to hide
// Currently configured for Pet Owner & Pet Lover only

export const FEATURES = {
  // ============================================
  // ENABLED FEATURES (Visible to users)
  // ============================================

  // Auth & Onboarding
  LOGIN: true,
  ONBOARDING: true,
  ROLE_SELECTION: true,  // Only shows Owner & Lover

  // Core Features
  HOME: true,
  PROFILE: true,
  EDIT_PROFILE: true,
  BROWSE: true,

  // Pet Owner Features
  MY_PETS: true,
  PETS: true,

  // Pet Lover Features
  PET_MATCH: true,  // Bumble-style swipe matching

  // ============================================
  // DISABLED FEATURES (Hidden - ready for later)
  // ============================================

  // Pet Care (Phase 2)
  PET_CARE_TIPS: false,

  // Booking & Orders (Phase 2)
  BOOKING: false,
  ORDERS: false,
  APPOINTMENTS: false,
  CALENDAR: false,

  // Provider Features (Phase 3 - Vet, Groomer, Supplier)
  DASHBOARD: false,
  PROVIDER_LISTINGS: false,
  PROVIDER_PROFILE: false,
  EARNINGS: false,
  ANALYTICS: false,
  INVENTORY: false,
  ADD_PRODUCT: false,

  // Communication
  MESSAGES: true,  // Enabled for Bumble-style chat
  NOTIFICATIONS: false,

  // Verification (Phase 2)
  AADHAAR_VERIFICATION: false,
} as const;

// Available roles for this version
export const ENABLED_ROLES = ['OWNER', 'LOVER'] as const;

// Helper function to check if a feature is enabled
export const isFeatureEnabled = (feature: keyof typeof FEATURES): boolean => {
  return FEATURES[feature] === true;
};

// Get all enabled features
export const getEnabledFeatures = (): string[] => {
  return Object.entries(FEATURES)
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature);
};

// Check if a role is enabled
export const isRoleEnabled = (role: string): boolean => {
  return ENABLED_ROLES.includes(role as any);
};
