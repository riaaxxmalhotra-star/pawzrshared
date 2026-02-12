// Feature Flags Configuration
// All roles and features enabled for full app experience

export const FEATURES = {
  // ============================================
  // CORE FEATURES (All roles)
  // ============================================

  // Auth & Onboarding
  LOGIN: true,
  ONBOARDING: true,
  ROLE_SELECTION: true,

  // Core Features
  HOME: true,
  PROFILE: true,
  EDIT_PROFILE: true,
  BROWSE: true,

  // Pet Owner Features
  MY_PETS: true,
  PETS: true,

  // Pet Lover Features
  PET_MATCH: true,

  // ============================================
  // PROVIDER FEATURES (Vet, Groomer, Supplier)
  // ============================================

  // Pet Care
  PET_CARE_TIPS: true,

  // Booking & Orders
  BOOKING: true,
  ORDERS: true,
  APPOINTMENTS: true,
  CALENDAR: true,

  // Provider Features
  DASHBOARD: true,
  PROVIDER_LISTINGS: true,
  PROVIDER_PROFILE: true,
  EARNINGS: true,
  ANALYTICS: true,
  INVENTORY: true,
  ADD_PRODUCT: true,

  // Communication
  MESSAGES: true,
  NOTIFICATIONS: true,

  // Verification
  AADHAAR_VERIFICATION: true,

  // ============================================
  // CAFE & EVENTS FEATURES
  // ============================================
  CAFE_DASHBOARD: true,
  CAFE_EVENTS: true,
  CAFE_BOOKINGS: true,
  CAFE_CRM: true,
  CAFE_ANALYTICS: true,
  CREATE_EVENT: true,
  EVENTS_LIST: true,
  EVENT_DETAIL: true,
  CAFE_DETAIL: true,
} as const;

// All roles enabled
export const ENABLED_ROLES = ['OWNER', 'LOVER', 'VET', 'GROOMER', 'SUPPLIER', 'CAFE'] as const;

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
