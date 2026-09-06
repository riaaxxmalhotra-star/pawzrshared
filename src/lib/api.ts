import ENV from '../config/env';
import logger from './logger';
import { getAuthToken, clearAuthToken } from './tokenStore';

const API_URL = ENV.API_URL;

// Default timeout for API requests (15 seconds)
const DEFAULT_TIMEOUT = 15000;

// Custom error class for API errors
export class ApiError extends Error {
  status: number;
  code?: string;
  /** Milliseconds to wait before retrying (from a 429/503 Retry-After header). */
  retryAfterMs?: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/** Encode a single path segment — call sites must never interpolate raw IDs. */
export function encodePath(value: string): string {
  return encodeURIComponent(value);
}

/**
 * Fires when a request proves the stored session is dead (HTTP 401 with a
 * token that the server rejected). Registered by the auth provider to trigger
 * sign-out. Deliberately a callback (not an import) to avoid a require cycle.
 */
let onUnauthorized: (() => unknown) | null = null;

export function setUnauthorizedHandler(handler: (() => unknown) | null): void {
  onUnauthorized = handler;
}

function notifyUnauthorized(): void {
  if (!onUnauthorized) return;
  try {
    const result = onUnauthorized();
    // Never let an async handler produce an unhandled rejection.
    if (result instanceof Promise) {
      result.catch(() => {});
    }
  } catch {
    // sign-out must never crash the request path
  }
}

/** Safely pull a human-readable message out of an unknown error payload. */
function extractErrorMessage(data: unknown, fallback: string): string {
  if (typeof data === 'string' && data.trim() !== '') return data;
  if (data !== null && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    for (const key of ['error', 'message']) {
      const value = record[key];
      if (typeof value === 'string' && value.trim() !== '') return value;
    }
    try {
      const serialized = JSON.stringify(data);
      if (serialized && serialized !== '{}') return serialized;
    } catch {
      // fall through to fallback
    }
  }
  return fallback;
}

function friendlyMessageForStatus(status: number): { message: string; code: string } {
  if (status === 401) return { message: 'Session expired. Please sign in again.', code: 'UNAUTHORIZED' };
  if (status === 403) return { message: 'You do not have permission to perform this action.', code: 'FORBIDDEN' };
  if (status === 404) return { message: 'The requested resource was not found.', code: 'NOT_FOUND' };
  if (status === 408) return { message: 'Request timed out. Please try again.', code: 'TIMEOUT' };
  if (status === 429) return { message: 'Too many requests. Please wait a moment and try again.', code: 'RATE_LIMITED' };
  if (status >= 500) return { message: 'Server error. Please try again later.', code: 'SERVER_ERROR' };
  return { message: 'Request failed', code: 'REQUEST_FAILED' };
}

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const token = await getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (error) {
    logger.error('Failed to get auth header');
    return {};
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const authHeader = await getAuthHeader();
  const callerSignal = options.signal ?? null;

  // Internal controller owns the timeout; a caller signal is *linked*, never
  // replaced, so unmounts can still cancel the request.
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeout);

  let unlinkCallerSignal: (() => void) | null = null;
  if (callerSignal) {
    if (callerSignal.aborted) {
      clearTimeout(timeoutId);
      throw new ApiError('Request was cancelled.', 0, 'ABORTED');
    }
    const onCallerAbort = () => controller.abort();
    callerSignal.addEventListener('abort', onCallerAbort, { once: true });
    unlinkCallerSignal = () => callerSignal.removeEventListener('abort', onCallerAbort);
  }

  try {
    // Omit our own signal key so the internal controller is never overridden.
    const { signal: _ignoredSignal, ...fetchOptions } = options;
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...authHeader,
        ...options.headers,
      },
    });

    // Handle different HTTP status codes
    if (!response.ok) {
      let errorMessage: string | undefined;
      let errorCode: string | undefined;

      try {
        const errorData: unknown = await response.json();
        errorMessage =
          extractErrorMessage(errorData, '') || undefined;
        const code = (errorData as Record<string, unknown> | null)?.code;
        if (typeof code === 'string' && code !== '') errorCode = code;
      } catch {
        // Response is not JSON — fall back to friendly mapping below.
      }

      const friendly = friendlyMessageForStatus(response.status);
      const apiError = new ApiError(
        errorMessage ?? friendly.message,
        response.status,
        errorCode ?? friendly.code
      );

      // Honor Retry-After on 429/503 so withRetry backs off correctly.
      if (response.status === 429 || response.status === 503) {
        const retryAfter = response.headers.get('retry-after');
        if (retryAfter) {
          const seconds = Number(retryAfter);
          if (Number.isFinite(seconds)) {
            apiError.retryAfterMs = seconds * 1000;
          }
        }
      }

      if (response.status === 401) {
        // Only treat 401 as "session dead" when we actually sent a token.
        // Public endpoints that 401 must not log the user out.
        const hadToken = Object.keys(authHeader).length > 0;
        if (hadToken) {
          await clearAuthToken().catch(() => {});
          notifyUnauthorized();
          logger.error('API 401: stored session cleared', { endpoint });
        }
      } else if (response.status >= 500) {
        logger.error('API server error', { endpoint, status: response.status });
      }

      throw apiError;
    }

    // 204 No Content (or any empty body) has nothing to parse.
    if (response.status === 204) {
      return {} as T;
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return {} as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Timeout fired from our own timer (not a caller cancel).
    if (error?.name === 'AbortError') {
      if (timedOut) {
        throw new ApiError(
          'Request timed out. Please check your internet connection.',
          0,
          'TIMEOUT'
        );
      }
      throw new ApiError('Request was cancelled.', 0, 'ABORTED');
    }

    // Handle network errors (message text varies by platform)
    if (error instanceof TypeError || /network|fetch|failed to connect|offline/i.test(String(error?.message ?? ''))) {
      throw new ApiError(
        'Unable to connect. Please check your internet connection.',
        0,
        'NETWORK_ERROR'
      );
    }

    // Unknown error
    throw new ApiError(
      (typeof error?.message === 'string' && error.message) || 'An unexpected error occurred.',
      0,
      'UNKNOWN_ERROR'
    );
  } finally {
    clearTimeout(timeoutId);
    unlinkCallerSignal?.();
  }
}

// Helper for retry logic — idempotent list GETs only. Never wire this to
// mutations: a retried POST can double-create server-side.
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      if (error instanceof ApiError) {
        // Caller cancellations must never be retried.
        if (error.code === 'ABORTED') throw error;
        // Don't retry on client errors (4xx) except 408 (timeout) and 429 (rate limit)
        if (error.status >= 400 && error.status < 500 && error.status !== 408 && error.status !== 429) {
          throw error;
        }
      }

      // Wait before retrying: exponential backoff with jitter, honoring
      // Retry-After, capped so a list refresh never hangs the UI.
      if (attempt < maxRetries) {
        const backoff = delayMs * 2 ** attempt;
        const jitter = Math.random() * 500;
        const serverAsked = error instanceof ApiError ? error.retryAfterMs ?? 0 : 0;
        const wait = Math.min(Math.max(backoff + jitter, serverAsked), 10000);
        await new Promise(resolve => setTimeout(resolve, wait));
      }
    }
  }

  throw lastError;
}

// Auth API
export const authApi = {
  googleToken: async (idToken: string, accessToken: string) => {
    return apiRequest('/native/google-token', {
      method: 'POST',
      body: JSON.stringify({ idToken, accessToken }),
    });
  },

  appleToken: async (idToken: string, user: any) => {
    return apiRequest('/native/apple-token', {
      method: 'POST',
      body: JSON.stringify({ idToken, user }),
    });
  },
};

// Pets API
export const petsApi = {
  getMyPets: async () => {
    return withRetry(() => apiRequest('/pets'));
  },

  getPet: async (petId: string) => {
    return apiRequest(`/pets/${encodePath(petId)}`);
  },

  createPet: async (petData: {
    name: string;
    species: string;
    breed: string;
    age: string;
    weight: string;
    medicalNotes?: string;
    behaviorNotes?: string;
    vaccinated?: boolean;
    neutered?: boolean;
  }) => {
    return apiRequest('/pets', {
      method: 'POST',
      body: JSON.stringify(petData),
    });
  },

  updatePet: async (petId: string, petData: any) => {
    return apiRequest(`/pets/${encodePath(petId)}`, {
      method: 'PUT',
      body: JSON.stringify(petData),
    });
  },

  deletePet: async (petId: string) => {
    return apiRequest(`/pets/${encodePath(petId)}`, {
      method: 'DELETE',
    });
  },
};

// Providers API (Vets, Groomers, Lovers)
export const providersApi = {
  getVets: async (city?: string) => {
    const query = city ? `?city=${encodeURIComponent(city)}` : '';
    return withRetry(() => apiRequest(`/browse/vets${query}`));
  },

  getVet: async (vetId: string) => {
    return apiRequest(`/browse/vets/${encodePath(vetId)}`);
  },

  getGroomers: async (city?: string) => {
    const query = city ? `?city=${encodeURIComponent(city)}` : '';
    return withRetry(() => apiRequest(`/browse/groomers${query}`));
  },

  getGroomer: async (groomerId: string) => {
    return apiRequest(`/browse/groomers/${encodePath(groomerId)}`);
  },

  getLovers: async (city?: string) => {
    const query = city ? `?city=${encodeURIComponent(city)}` : '';
    return withRetry(() => apiRequest(`/browse/lovers${query}`));
  },

  getLover: async (loverId: string) => {
    return apiRequest(`/browse/lovers/${encodePath(loverId)}`);
  },
};

// Products API
export const productsApi = {
  getProducts: async (category?: string) => {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    return withRetry(() => apiRequest(`/browse/products${query}`));
  },

  getProduct: async (productId: string) => {
    return apiRequest(`/browse/products/${encodePath(productId)}`);
  },

  searchProducts: async (query: string) => {
    return apiRequest(`/browse/products?search=${encodeURIComponent(query)}`);
  },

  // Supplier-owned catalog (same surface as ProviderListingsScreen).
  getMyProducts: async () => {
    return withRetry(() => apiRequest('/products/my-products'));
  },

  // Partial update of a supplier product (stock, price, isActive, ...).
  // Backend convention assumption (PUT /products/:id) — see updateOrderStatus.
  updateProduct: async (productId: string, updates: Record<string, unknown>) => {
    return apiRequest(`/products/${encodePath(productId)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
};

// Bookings API
//
// State machine: bookings move pending -> confirmed -> completed, with
// cancelled / no_show reachable from pending or confirmed. Terminal states
// accept no transitions. Enforced here AND (must be) server-side; the client
// guard turns illegal taps into an explanatory message instead of a 4xx.
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

const BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ['confirmed', 'cancelled', 'no_show'],
  confirmed: ['completed', 'cancelled', 'no_show'],
  completed: [],
  cancelled: [],
  no_show: [],
};

export function canTransitionBooking(from: string, to: BookingStatus): boolean {
  const allowed = (BOOKING_TRANSITIONS as Record<string, BookingStatus[]>)[from] ?? [];
  return allowed.includes(to);
}

export const bookingsApi = {
  getMyBookings: async () => {
    return withRetry(() => apiRequest('/bookings'));
  },

  createBooking: async (bookingData: {
    providerId: string;
    petId: string;
    date: string;
    time: string;
    duration: number;
    notes?: string;
    serviceType: string;
  }) => {
    return apiRequest('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  },

  cancelBooking: async (bookingId: string) => {
    return apiRequest(`/bookings/${encodePath(bookingId)}/cancel`, {
      method: 'POST',
    });
  },
  getBooking: async (bookingId: string) => {
    return apiRequest(`/bookings/${encodePath(bookingId)}`);
  },

  updateBooking: async (bookingId: string, bookingData: {
    status?: string;
    notes?: string;
    date?: string;
    time?: string;
  }) => {
    return apiRequest(`/bookings/${encodePath(bookingId)}`, {
      method: 'PUT',
      body: JSON.stringify(bookingData),
    });
  },
};

// Orders API
export const ordersApi = {
  getMyOrders: async () => {
    return withRetry(() => apiRequest('/orders'));
  },

  createOrder: async (orderData: {
    items: { productId: string; quantity: number }[];
    addressId: string;
  }) => {
    return apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  getOrder: async (orderId: string) => {
    return apiRequest(`/orders/${encodePath(orderId)}`);
  },

  // Update an order's fulfilment status. Backend convention assumption
  // (PUT /orders/:id/status) — failures surface honestly via ApiError.
  updateOrderStatus: async (
    orderId: string,
    status: 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  ) => {
    return apiRequest(`/orders/${encodePath(orderId)}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
};

// Messages API
export const messagesApi = {
  getConversations: async () => {
    return withRetry(() => apiRequest('/conversations'));
  },

  getMessages: async (conversationId: string) => {
    return apiRequest(`/conversations/${conversationId}/messages`);
  },

  sendMessage: async (conversationId: string, content: string, recipientId?: string) => {
    return apiRequest(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, recipientId }),
    });
  },

  startConversation: async (recipientId: string, message: string) => {
    return apiRequest('/conversations', {
      method: 'POST',
      body: JSON.stringify({ recipientId, message }),
    });
  },

  // Mark messages as read
  markAsRead: async (conversationId: string) => {
    return apiRequest(`/conversations/${conversationId}/read`, {
      method: 'POST',
    });
  },
};

// Profile API
export const profileApi = {
  getProfile: async () => {
    return apiRequest('/profile');
  },

  updateProfile: async (profileData: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    zipCode?: string;
    bio?: string;
  }) => {
    return apiRequest('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  updateRole: async (userId: string, role: string) => {
    return apiRequest('/users/update-role', {
      method: 'POST',
      body: JSON.stringify({ userId, role }),
    });
  },

  deleteAccount: async () => {
    return apiRequest('/users/me', {
      method: 'DELETE',
    });
  },
};

// Events API
export const eventsApi = {
  // Get all events (for consumers)
  getEvents: async (filters?: { city?: string; eventType?: string; date?: string }) => {
    const params = new URLSearchParams();
    if (filters?.city) params.append('city', filters.city);
    if (filters?.eventType) params.append('eventType', filters.eventType);
    if (filters?.date) params.append('date', filters.date);
    const query = params.toString() ? `?${params.toString()}` : '';
    return withRetry(() => apiRequest(`/events${query}`));
  },

  // Get single event details
  getEvent: async (eventId: string) => {
    return apiRequest(`/events/${encodePath(eventId)}`);
  },

  // RSVP/Book an event (for consumers)
  rsvpEvent: async (eventId: string, bookingData?: {
    guestCount?: number;
    petName?: string;
    specialRequests?: string;
  }) => {
    return apiRequest(`/events/${eventId}/rsvp`, {
      method: 'POST',
      body: JSON.stringify(bookingData || {}),
    });
  },

  // Cancel event booking
  cancelRsvp: async (eventId: string) => {
    return apiRequest(`/events/${eventId}/rsvp`, {
      method: 'DELETE',
    });
  },

  // Get my event bookings (for consumers)
  getMyEventBookings: async () => {
    return withRetry(() => apiRequest('/events/bookings/my'));
  },

  // --- Cafe Owner endpoints ---

  // Get my events (for cafe owners)
  getMyEvents: async () => {
    return withRetry(() => apiRequest('/cafe/events'));
  },

  // Create event (for cafe owners)
  createEvent: async (eventData: {
    title: string;
    description: string;
    eventType: string;
    date: string;
    startTime: string;
    endTime: string;
    coverImage?: string;
    price: number;
    capacity: number;
    petTypes: string[];
    amenities: string[];
    requirements?: string[];
    status?: 'upcoming' | 'draft';
  }) => {
    return apiRequest('/cafe/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  },

  // Update event (for cafe owners)
  updateEvent: async (eventId: string, eventData: any) => {
    return apiRequest(`/cafe/events/${encodePath(eventId)}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  },

  // Delete event (for cafe owners)
  deleteEvent: async (eventId: string) => {
    return apiRequest(`/cafe/events/${encodePath(eventId)}`, {
      method: 'DELETE',
    });
  },

  // Get event bookings (for cafe owners)
  getEventBookings: async (eventId: string) => {
    return apiRequest(`/cafe/events/${eventId}/bookings`);
  },
};

// Cafes API
export const cafesApi = {
  // Get all cafes (for consumers)
  getCafes: async (filters?: { city?: string; petType?: string }) => {
    const params = new URLSearchParams();
    if (filters?.city) params.append('city', filters.city);
    if (filters?.petType) params.append('petType', filters.petType);
    const query = params.toString() ? `?${params.toString()}` : '';
    return withRetry(() => apiRequest(`/cafes${query}`));
  },

  // Get single cafe details
  getCafe: async (cafeId: string) => {
    return apiRequest(`/cafes/${encodePath(cafeId)}`);
  },

  // Get cafe events
  getCafeEvents: async (cafeId: string) => {
    return apiRequest(`/cafes/${cafeId}/events`);
  },

  // Get cafe reviews
  getCafeReviews: async (cafeId: string) => {
    return apiRequest(`/cafes/${cafeId}/reviews`);
  },

  // Book a table at cafe
  bookTable: async (cafeId: string, bookingData: {
    date: string;
    time: string;
    guestCount: number;
    petName?: string;
    specialRequests?: string;
  }) => {
    return apiRequest(`/cafes/${cafeId}/book`, {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  },

  // Cancel table booking
  cancelBooking: async (bookingId: string) => {
    return apiRequest(`/cafe/bookings/${encodePath(bookingId)}/cancel`, {
      method: 'POST',
    });
  },

  // Submit review for cafe
  submitReview: async (cafeId: string, reviewData: {
    rating: number;
    comment: string;
    petName?: string;
  }) => {
    return apiRequest(`/cafes/${cafeId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  },

  // --- Cafe Owner endpoints ---

  // Get my cafe profile (for cafe owners)
  getMyCafe: async () => {
    return apiRequest('/cafe/profile');
  },

  // Update cafe profile (for cafe owners)
  updateCafe: async (cafeData: {
    name?: string;
    description?: string;
    photos?: string[];
    petAmenities?: string[];
    generalAmenities?: string[];
    openTime?: string;
    closeTime?: string;
    workingDays?: string[];
    priceRange?: string;
    seatingCapacity?: number;
  }) => {
    return apiRequest('/cafe/profile', {
      method: 'PUT',
      body: JSON.stringify(cafeData),
    });
  },

  // Get my bookings (for cafe owners)
  getMyBookings: async (filters?: { status?: string; date?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.date) params.append('date', filters.date);
    const query = params.toString() ? `?${params.toString()}` : '';
    return withRetry(() => apiRequest(`/cafe/bookings${query}`));
  },

  // Update booking status (for cafe owners)
  updateBookingStatus: async (bookingId: string, status: 'confirmed' | 'completed' | 'cancelled' | 'no_show') => {
    return apiRequest(`/cafe/bookings/${encodePath(bookingId)}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Get analytics (for cafe owners)
  getAnalytics: async (timeRange?: 'today' | 'week' | 'month' | 'year') => {
    const query = timeRange ? `?range=${timeRange}` : '';
    return apiRequest(`/cafe/analytics${query}`);
  },

  // Get customers/CRM data (for cafe owners)
  getCustomers: async (segment?: 'all' | 'vip' | 'regular' | 'new' | 'inactive') => {
    const query = segment && segment !== 'all' ? `?segment=${segment}` : '';
    return withRetry(() => apiRequest(`/cafe/customers${query}`));
  },

  // Get customer details (for cafe owners)
  getCustomer: async (customerId: string) => {
    return apiRequest(`/cafe/customers/${encodePath(customerId)}`);
  },

  // Add customer note (for cafe owners)
  addCustomerNote: async (customerId: string, note: string) => {
    return apiRequest(`/cafe/customers/${customerId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  },

  // Send promotional message to customer
  sendPromotion: async (customerId: string, message: string) => {
    return apiRequest(`/cafe/customers/${customerId}/promotion`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },
};

// Likes/Matching API
export const likesApi = {
  sendLike: async (targetId: string, liked: boolean) => {
    return apiRequest('/likes', {
      method: 'POST',
      body: JSON.stringify({ targetId, liked }),
    });
  },

  getMatches: async () => {
    return withRetry(() => apiRequest('/likes'));
  },

  createConversation: async (userId: string) => {
    return apiRequest('/conversations', {
      method: 'POST',
      body: JSON.stringify({ recipientId: userId }),
    });
  },
};

// Location API
export const locationApi = {
  updateLocation: async (latitude: number, longitude: number) => {
    return apiRequest('/users/location', {
      method: 'PUT',
      body: JSON.stringify({ latitude, longitude }),
    }, 10000); // 10 second timeout for location updates
  },
};

// Push Notifications API
export const notificationsApi = {
  // Upload the Expo push token for this device. Backend convention
  // assumption (POST /users/push-token) — failures surface honestly.
  registerToken: async (token: string, platform?: string) => {
    return apiRequest('/users/push-token', {
      method: 'POST',
      body: JSON.stringify({ token, platform }),
    });
  },
};

// Swipe Profiles API
export const swipeApi = {
  getProfiles: async (userLat?: number, userLng?: number) => {
    const params = new URLSearchParams();
    if (userLat !== undefined) params.append('lat', String(userLat));
    if (userLng !== undefined) params.append('lng', String(userLng));
    const query = params.toString() ? `?${params.toString()}` : '';
    return withRetry(() => apiRequest(`/swipe${query}`));
  },
};
