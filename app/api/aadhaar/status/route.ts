import { NextRequest, NextResponse } from 'next/server';
import { getIdentityFromRequest, getVerification } from '../_store';

// Returns the caller's own verification state — no longer a hardcoded stub.
export async function GET(request: NextRequest) {
  try {
    const identity = getIdentityFromRequest(request);
    if (!identity) {
      return NextResponse.json(
        { verified: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const record = getVerification(identity);
    if (!record) {
      return NextResponse.json({ verified: false, verifiedAt: null });
    }

    return NextResponse.json({
      verified: true,
      verifiedAt: new Date(record.verifiedAt).toISOString(),
    });
  } catch (error: any) {
    console.error('Aadhaar status check error:', error);
    return NextResponse.json(
      {
        verified: false,
        error: 'Failed to check verification status',
      },
      { status: 500 }
    );
  }
}
