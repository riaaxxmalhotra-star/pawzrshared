import AsyncStorage from '@react-native-async-storage/async-storage';
import ENV from '../config/env';
import logger from './logger';

const API_URL = ENV.API_URL;

// Aadhaar verification response types
interface AadhaarOtpResponse {
  success: boolean;
  message: string;
  transactionId?: string;
  maskedMobile?: string;
  error?: string;
}

interface AadhaarVerifyResponse {
  success: boolean;
  message: string;
  verified: boolean;
  data?: {
    name?: string;
    gender?: string;
    dob?: string;
    address?: string;
    photo?: string; // Base64 encoded photo from Aadhaar
  };
  error?: string;
}

// Store transaction ID for OTP verification
let currentTransactionId: string | null = null;

async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const authHeader = await getAuthHeader();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

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

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    return response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your internet connection.');
    }
    throw error;
  }
}

export const aadhaarApi = {
  /**
   * Request OTP for Aadhaar verification
   * This sends an OTP to the mobile number linked with the Aadhaar
   */
  requestOtp: async (aadhaarNumber: string): Promise<AadhaarOtpResponse> => {
    try {
      logger.log('Requesting Aadhaar OTP');

      // Validate Aadhaar number format
      const cleanAadhaar = aadhaarNumber.replace(/\s/g, '');
      if (cleanAadhaar.length !== 12 || !/^\d+$/.test(cleanAadhaar)) {
        return {
          success: false,
          message: 'Invalid Aadhaar number format',
          error: 'INVALID_FORMAT',
        };
      }

      // First digit cannot be 0 or 1 (UIDAI rule)
      if (cleanAadhaar[0] === '0' || cleanAadhaar[0] === '1') {
        return {
          success: false,
          message: 'Invalid Aadhaar number',
          error: 'INVALID_AADHAAR',
        };
      }

      const response = await apiRequest<AadhaarOtpResponse>('/aadhaar/request-otp', {
        method: 'POST',
        body: JSON.stringify({ aadhaarNumber: cleanAadhaar }),
      });

      if (response.success && response.transactionId) {
        currentTransactionId = response.transactionId;
      }

      return response;
    } catch (error: any) {
      logger.error('Aadhaar OTP request failed');
      return {
        success: false,
        message: error.message || 'Failed to request OTP. Please try again.',
        error: 'NETWORK_ERROR',
      };
    }
  },

  /**
   * Verify OTP and complete Aadhaar verification
   */
  verifyOtp: async (otp: string, transactionId?: string): Promise<AadhaarVerifyResponse> => {
    try {
      logger.log('Verifying Aadhaar OTP');

      const txnId = transactionId || currentTransactionId;
      if (!txnId) {
        return {
          success: false,
          message: 'Session expired. Please request a new OTP.',
          verified: false,
          error: 'NO_TRANSACTION',
        };
      }

      if (otp.length !== 6 || !/^\d+$/.test(otp)) {
        return {
          success: false,
          message: 'Invalid OTP format',
          verified: false,
          error: 'INVALID_OTP_FORMAT',
        };
      }

      const response = await apiRequest<AadhaarVerifyResponse>('/aadhaar/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          otp,
          transactionId: txnId,
        }),
      });

      // Clear transaction ID after verification attempt
      if (response.verified) {
        currentTransactionId = null;
      }

      return response;
    } catch (error: any) {
      logger.error('Aadhaar OTP verification failed');
      return {
        success: false,
        message: error.message || 'Verification failed. Please try again.',
        verified: false,
        error: 'NETWORK_ERROR',
      };
    }
  },

  /**
   * Resend OTP for Aadhaar verification
   */
  resendOtp: async (aadhaarNumber: string): Promise<AadhaarOtpResponse> => {
    // Clear existing transaction and request new OTP
    currentTransactionId = null;
    return aadhaarApi.requestOtp(aadhaarNumber);
  },

  /**
   * Get current verification status for the user
   */
  getVerificationStatus: async (): Promise<{ verified: boolean; verifiedAt?: string }> => {
    try {
      const response = await apiRequest<{ verified: boolean; verifiedAt?: string }>('/aadhaar/status', {
        method: 'GET',
      });
      return response;
    } catch (error) {
      logger.error('Failed to get Aadhaar verification status');
      return { verified: false };
    }
  },

  /**
   * Clear current transaction (for cancellation/timeout)
   */
  clearTransaction: () => {
    currentTransactionId = null;
  },
};

export default aadhaarApi;
