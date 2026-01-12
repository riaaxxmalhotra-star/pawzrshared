import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://pawzrpro.vercel.app/api';

async function getAuthHeader() {
  const token = await AsyncStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const url = `${API_URL}${endpoint}`;
  const authHeader = await getAuthHeader();

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
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
    return apiRequest('/pets');
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
    return apiRequest(`/browse/vets${query}`);
  },

  getVet: async (vetId: string) => {
    return apiRequest(`/browse/vets/${vetId}`);
  },

  getGroomers: async (city?: string) => {
    const query = city ? `?city=${encodeURIComponent(city)}` : '';
    return apiRequest(`/browse/groomers${query}`);
  },

  getGroomer: async (groomerId: string) => {
    return apiRequest(`/browse/groomers/${groomerId}`);
  },

  getLovers: async (city?: string) => {
    const query = city ? `?city=${encodeURIComponent(city)}` : '';
    return apiRequest(`/browse/lovers${query}`);
  },

  getLover: async (loverId: string) => {
    return apiRequest(`/browse/lovers/${loverId}`);
  },
};

// Products API
export const productsApi = {
  getProducts: async (category?: string) => {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    return apiRequest(`/browse/products${query}`);
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
    return apiRequest('/bookings');
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
};

// Orders API
export const ordersApi = {
  getMyOrders: async () => {
    return apiRequest('/orders');
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
    return apiRequest('/conversations');
  },

  getMessages: async (conversationId: string) => {
    return apiRequest(`/conversations/${conversationId}/messages`);
  },

  sendMessage: async (conversationId: string, content: string) => {
    return apiRequest(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  startConversation: async (recipientId: string, message: string) => {
    return apiRequest('/conversations', {
      method: 'POST',
      body: JSON.stringify({ recipientId, message }),
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
  getEvents: async () => {
    return apiRequest('/events');
  },

  getEvent: async (eventId: string) => {
    return apiRequest(`/events/${eventId}`);
  },

  rsvpEvent: async (eventId: string) => {
    return apiRequest(`/events/${eventId}/rsvp`, {
      method: 'POST',
    });
  },
};
