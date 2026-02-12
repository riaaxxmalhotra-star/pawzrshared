import AsyncStorage from '@react-native-async-storage/async-storage';
import ENV from '../config/env';
import logger from './logger';

const API_URL = ENV.API_URL;

// Default timeout for API requests (15 seconds)
const DEFAULT_TIMEOUT = 15000;

// Custom error class for API errors
export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const token = await AsyncStorage.getItem('token');
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

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...authHeader,
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    // Handle different HTTP status codes
    if (!response.ok) {
      let errorMessage = 'Request failed';
      let errorCode: string | undefined;

      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        errorCode = errorData.code;
      } catch {
        // Response is not JSON
        if (response.status === 401) {
          errorMessage = 'Session expired. Please sign in again.';
          errorCode = 'UNAUTHORIZED';
        } else if (response.status === 403) {
          errorMessage = 'You do not have permission to perform this action.';
          errorCode = 'FORBIDDEN';
        } else if (response.status === 404) {
          errorMessage = 'The requested resource was not found.';
          errorCode = 'NOT_FOUND';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
          errorCode = 'SERVER_ERROR';
        }
      }

      throw new ApiError(errorMessage, response.status, errorCode);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return {} as T;
  } catch (error: any) {
    clearTimeout(timeoutId);

    // Handle abort/timeout
    if (error.name === 'AbortError') {
      throw new ApiError(
        'Request timed out. Please check your internet connection.',
        0,
        'TIMEOUT'
      );
    }

    // Handle network errors
    if (error.message === 'Network request failed' || error.message === 'Failed to fetch') {
      throw new ApiError(
        'Unable to connect. Please check your internet connection.',
        0,
        'NETWORK_ERROR'
      );
    }

    // Re-throw ApiError as is
    if (error instanceof ApiError) {
      throw error;
    }

    // Unknown error
    throw new ApiError(
      error.message || 'An unexpected error occurred.',
      0,
      'UNKNOWN_ERROR'
    );
  }
}

// Helper for retry logic
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

      // Don't retry on client errors (4xx) except 408 (timeout) and 429 (rate limit)
      if (error instanceof ApiError) {
        if (error.status >= 400 && error.status < 500 && error.status !== 408 && error.status !== 429) {
          throw error;
        }
      }

      // Wait before retrying
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
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
    return apiRequest(`/pets/${petId}`);
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
    return apiRequest(`/pets/${petId}`, {
      method: 'PUT',
      body: JSON.stringify(petData),
    });
  },

  deletePet: async (petId: string) => {
    return apiRequest(`/pets/${petId}`, {
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
    return apiRequest(`/browse/vets/${vetId}`);
  },

  getGroomers: async (city?: string) => {
    const query = city ? `?city=${encodeURIComponent(city)}` : '';
    return withRetry(() => apiRequest(`/browse/groomers${query}`));
  },

  getGroomer: async (groomerId: string) => {
    return apiRequest(`/browse/groomers/${groomerId}`);
  },

  getLovers: async (city?: string) => {
    const query = city ? `?city=${encodeURIComponent(city)}` : '';
    return withRetry(() => apiRequest(`/browse/lovers${query}`));
  },

  getLover: async (loverId: string) => {
    return apiRequest(`/browse/lovers/${loverId}`);
  },
};

// Products API
export const productsApi = {
  getProducts: async (category?: string) => {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    return withRetry(() => apiRequest(`/browse/products${query}`));
  },

  getProduct: async (productId: string) => {
    return apiRequest(`/browse/products/${productId}`);
  },

  searchProducts: async (query: string) => {
    return apiRequest(`/browse/products?search=${encodeURIComponent(query)}`);
  },
};

// Bookings API
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
    return apiRequest(`/bookings/${bookingId}/cancel`, {
      method: 'POST',
    });
  },

  getBooking: async (bookingId: string) => {
    return apiRequest(`/bookings/${bookingId}`);
  },

  updateBooking: async (bookingId: string, bookingData: {
    status?: string;
    notes?: string;
    date?: string;
    time?: string;
  }) => {
    return apiRequest(`/bookings/${bookingId}`, {
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
    return apiRequest(`/orders/${orderId}`);
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
    return apiRequest(`/events/${eventId}`);
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
    return apiRequest(`/cafe/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  },

  // Delete event (for cafe owners)
  deleteEvent: async (eventId: string) => {
    return apiRequest(`/cafe/events/${eventId}`, {
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
    return apiRequest(`/cafes/${cafeId}`);
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
    return apiRequest(`/cafe/bookings/${bookingId}/cancel`, {
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
    return apiRequest(`/cafe/bookings/${bookingId}/status`, {
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
    return apiRequest(`/cafe/customers/${customerId}`);
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
