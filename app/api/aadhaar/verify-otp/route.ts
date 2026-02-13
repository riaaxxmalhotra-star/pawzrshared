import { NextRequest, NextResponse } from 'next/server';
import { getDigioClient } from '../../../../lib/digio';
import { transactionStore } from '../request-otp/route';

// Store verified users (in production, save to database)
export const verifiedUsers = new Map<string, {
  maskedAadhaar: string;
  name: string;
  verifiedAt: Date;
}>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { otp, transactionId } = body;

    // Validate inputs
    if (!otp || typeof otp !== 'string') {
      return NextResponse.json(
        { success: false, verified: false, message: 'OTP is required' },
        { status: 400 }
      );
    }

    if (!transactionId || typeof transactionId !== 'string') {
      return NextResponse.json(
        { success: false, verified: false, message: 'Session expired. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Validate OTP format
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      return NextResponse.json(
        { success: false, verified: false, message: 'Invalid OTP format' },
        { status: 400 }
      );
    }

    // Check if transaction exists
    const transaction = transactionStore.get(transactionId);
    if (!transaction) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          message: 'Session expired. Please request a new OTP.',
          error: 'TRANSACTION_EXPIRED',
        },
        { status: 400 }
      );
    }

    // Check if transaction is too old (10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    if (transaction.createdAt < tenMinutesAgo) {
      transactionStore.delete(transactionId);
      return NextResponse.json(
        {
          success: false,
          verified: false,
          message: 'OTP expired. Please request a new OTP.',
          error: 'OTP_EXPIRED',
        },
        { status: 400 }
      );
    }

    // Call Digio API to verify OTP
    const digio = getDigioClient();
    const result = await digio.verifyOtp(transactionId, otp);

    if (result.success && result.verified) {
      // Clean up transaction
      transactionStore.delete(transactionId);

      // Store verification (in production, save to user profile in database)
      if (result.data?.maskedAadhaar) {
        verifiedUsers.set(transaction.aadhaarNumber.slice(-4), {
          maskedAadhaar: result.data.maskedAadhaar,
          name: result.data.name || '',
          verifiedAt: new Date(),
        });
      }

      return NextResponse.json({
        success: true,
        verified: true,
        message: result.message,
        data: {
          name: result.data?.name,
          gender: result.data?.gender,
          dob: result.data?.dob,
          address: result.data?.address,
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        verified: false,
        message: result.message,
        error: result.error,
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Aadhaar OTP verify error:', error);

    // Handle Digio not configured
    if (error.message?.includes('credentials not configured')) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          message: 'Aadhaar verification service is not configured',
          error: 'SERVICE_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        verified: false,
        message: 'Failed to verify OTP. Please try again.',
        error: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
