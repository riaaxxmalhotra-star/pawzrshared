import { NextRequest, NextResponse } from 'next/server';
import { getDigioClient } from '../../../../lib/digio';
import {
  getIdentityFromRequest,
  checkRateLimit,
  saveTransaction,
  hashAadhaar,
} from '../_store';

export async function POST(request: NextRequest) {
  try {
    // Anonymous callers must not be able to burn the Digio OTP quota.
    const identity = getIdentityFromRequest(request);
    if (!identity) {
      return NextResponse.json(
        { success: false, message: 'Authentication required', error: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    if (!checkRateLimit(identity)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many OTP requests. Please wait a few minutes and try again.',
          error: 'RATE_LIMITED',
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { aadhaarNumber } = body;

    // Validate Aadhaar number
    if (!aadhaarNumber || typeof aadhaarNumber !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Aadhaar number is required' },
        { status: 400 }
      );
    }

    const cleanAadhaar = aadhaarNumber.replace(/\s/g, '');

    // Validate format
    if (cleanAadhaar.length !== 12 || !/^\d+$/.test(cleanAadhaar)) {
      return NextResponse.json(
        { success: false, message: 'Invalid Aadhaar number format' },
        { status: 400 }
      );
    }

    // First digit cannot be 0 or 1 (UIDAI rule)
    if (cleanAadhaar[0] === '0' || cleanAadhaar[0] === '1') {
      return NextResponse.json(
        { success: false, message: 'Invalid Aadhaar number' },
        { status: 400 }
      );
    }

    // Call Digio API
    const digio = getDigioClient();
    const result = await digio.requestOtp(cleanAadhaar);

    if (result.success && result.transactionId) {
      // Store the transaction bound to this caller. The full Aadhaar number
      // is never persisted — only its hash, for request binding.
      saveTransaction({
        hashedAadhaar: hashAadhaar(cleanAadhaar),
        transactionId: result.transactionId,
        identity,
      });

      return NextResponse.json({
        success: true,
        message: result.message,
        transactionId: result.transactionId,
        maskedMobile: result.maskedMobile,
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: result.message,
        error: result.error,
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Aadhaar OTP request error:', error);

    // Handle Digio not configured
    if (error.message?.includes('credentials not configured')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Aadhaar verification service is not configured',
          error: 'SERVICE_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to request OTP. Please try again.',
        error: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
