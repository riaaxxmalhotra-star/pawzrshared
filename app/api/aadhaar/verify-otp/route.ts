import { NextRequest, NextResponse } from 'next/server';
import { getDigioClient } from '../../../../lib/digio';
import {
  getIdentityFromRequest,
  getTransaction,
  recordOtpAttempt,
  consumeTransaction,
  saveVerification,
} from '../_store';

export async function POST(request: NextRequest) {
  try {
    const identity = getIdentityFromRequest(request);
    if (!identity) {
      return NextResponse.json(
        { success: false, verified: false, message: 'Authentication required', error: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

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

    // Transaction must exist AND belong to this caller.
    const lookup = getTransaction(transactionId, identity);
    if (lookup.status !== 'ok') {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          message:
            lookup.status === 'expired'
              ? 'OTP expired. Please request a new OTP.'
              : 'Session expired. Please request a new OTP.',
          error: lookup.status === 'expired' ? 'OTP_EXPIRED' : 'TRANSACTION_EXPIRED',
        },
        { status: 400 }
      );
    }

    // Bound the OTP guessing budget per transaction.
    if (!recordOtpAttempt(transactionId)) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          message: 'Too many incorrect attempts. Please request a new OTP.',
          error: 'ATTEMPTS_EXHAUSTED',
        },
        { status: 400 }
      );
    }

    // Call Digio API to verify OTP
    const digio = getDigioClient();
    const result = await digio.verifyOtp(transactionId, otp);

    if (result.success && result.verified) {
      // Single-use transaction: consume on success.
      consumeTransaction(transactionId);

      // Verification is recorded per caller identity (never keyed by Aadhaar
      // last-4, which collides across users). Only the last 4 digits and the
      // display name are kept — never the full number.
      saveVerification({
        identity,
        maskedLast4: (result.data?.maskedAadhaar ?? '').slice(-4),
        name: result.data?.name || '',
      });

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
