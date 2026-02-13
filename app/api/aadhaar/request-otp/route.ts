import { NextRequest, NextResponse } from 'next/server';
import { getDigioClient } from '../../../../lib/digio';

// In-memory store for transactions (use Redis/DB in production)
export const transactionStore = new Map<string, { aadhaarNumber: string; transactionId: string; createdAt: Date }>();

// Clean up old transactions (older than 10 minutes)
function cleanupOldTransactions() {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  for (const [key, value] of transactionStore.entries()) {
    if (value.createdAt < tenMinutesAgo) {
      transactionStore.delete(key);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Clean up old transactions
    cleanupOldTransactions();

    // Call Digio API
    const digio = getDigioClient();
    const result = await digio.requestOtp(cleanAadhaar);

    if (result.success && result.transactionId) {
      // Store transaction for verification
      transactionStore.set(result.transactionId, {
        aadhaarNumber: cleanAadhaar,
        transactionId: result.transactionId,
        createdAt: new Date(),
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
