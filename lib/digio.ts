/**
 * Digio Aadhaar OTP Verification Integration
 *
 * Digio API Documentation: https://docs.digio.in
 *
 * Flow:
 * 1. Request OTP -> Digio sends OTP to Aadhaar-linked mobile
 * 2. Verify OTP -> Returns user data if successful
 */

const DIGIO_SANDBOX_URL = 'https://ext.digio.in:444/client/kyc/v2';
const DIGIO_PRODUCTION_URL = 'https://api.digio.in/client/kyc/v2';

interface DigioConfig {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'production';
}

interface DigioOtpRequestResponse {
  id: string; // Transaction ID
  status: string;
  message?: string;
  mobile_last_digits?: string;
}

interface DigioOtpVerifyResponse {
  id: string;
  status: string;
  message?: string;
  aadhaar_data?: {
    name: string;
    gender: string;
    dob: string;
    address: {
      house: string;
      street: string;
      landmark: string;
      locality: string;
      vtc: string;
      district: string;
      state: string;
      pincode: string;
      country: string;
    };
    photo: string; // Base64 encoded
    masked_aadhaar: string;
  };
}

class DigioClient {
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;

  constructor(config: DigioConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.baseUrl = config.environment === 'production'
      ? DIGIO_PRODUCTION_URL
      : DIGIO_SANDBOX_URL;
  }

  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    return `Basic ${credentials}`;
  }

  /**
   * Request OTP for Aadhaar verification
   * Digio will send OTP to the mobile number linked with Aadhaar
   */
  async requestOtp(aadhaarNumber: string): Promise<{
    success: boolean;
    transactionId?: string;
    maskedMobile?: string;
    message: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/aadhaar/id/otp`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_no: aadhaarNumber,
        }),
      });

      const data: DigioOtpRequestResponse = await response.json();

      if (response.ok && data.id) {
        return {
          success: true,
          transactionId: data.id,
          maskedMobile: data.mobile_last_digits ? `XXXXXX${data.mobile_last_digits}` : undefined,
          message: 'OTP sent successfully to your Aadhaar-linked mobile number',
        };
      }

      return {
        success: false,
        message: data.message || 'Failed to send OTP. Please check your Aadhaar number.',
        error: data.status || 'REQUEST_FAILED',
      };
    } catch (error: any) {
      console.error('Digio OTP request error:', error);
      return {
        success: false,
        message: 'Failed to connect to verification service. Please try again.',
        error: 'NETWORK_ERROR',
      };
    }
  }

  /**
   * Verify OTP and get Aadhaar data
   */
  async verifyOtp(transactionId: string, otp: string): Promise<{
    success: boolean;
    verified: boolean;
    message: string;
    data?: {
      name?: string;
      gender?: string;
      dob?: string;
      address?: string;
      photo?: string;
      maskedAadhaar?: string;
    };
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/aadhaar/id/otp/verify`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: transactionId,
          otp: otp,
        }),
      });

      const data: DigioOtpVerifyResponse = await response.json();

      if (response.ok && data.status === 'success' && data.aadhaar_data) {
        const aadhaar = data.aadhaar_data;
        const address = aadhaar.address;
        const fullAddress = [
          address.house,
          address.street,
          address.landmark,
          address.locality,
          address.vtc,
          address.district,
          address.state,
          address.pincode,
        ].filter(Boolean).join(', ');

        return {
          success: true,
          verified: true,
          message: 'Aadhaar verification successful',
          data: {
            name: aadhaar.name,
            gender: aadhaar.gender,
            dob: aadhaar.dob,
            address: fullAddress,
            photo: aadhaar.photo,
            maskedAadhaar: aadhaar.masked_aadhaar,
          },
        };
      }

      // Handle invalid OTP
      if (data.status === 'failed' || data.message?.toLowerCase().includes('invalid')) {
        return {
          success: false,
          verified: false,
          message: 'Invalid OTP. Please try again.',
          error: 'INVALID_OTP',
        };
      }

      return {
        success: false,
        verified: false,
        message: data.message || 'Verification failed. Please try again.',
        error: data.status || 'VERIFICATION_FAILED',
      };
    } catch (error: any) {
      console.error('Digio OTP verify error:', error);
      return {
        success: false,
        verified: false,
        message: 'Failed to verify OTP. Please try again.',
        error: 'NETWORK_ERROR',
      };
    }
  }
}

// Export singleton instance
let digioClient: DigioClient | null = null;

export function getDigioClient(): DigioClient {
  if (!digioClient) {
    const clientId = process.env.DIGIO_CLIENT_ID;
    const clientSecret = process.env.DIGIO_CLIENT_SECRET;
    const environment = (process.env.DIGIO_ENV || 'sandbox') as 'sandbox' | 'production';

    if (!clientId || !clientSecret) {
      throw new Error('Digio credentials not configured. Please set DIGIO_CLIENT_ID and DIGIO_CLIENT_SECRET.');
    }

    digioClient = new DigioClient({
      clientId,
      clientSecret,
      environment,
    });
  }

  return digioClient;
}

export { DigioClient };
export default getDigioClient;
