import { NextRequest, NextResponse } from 'next/server';

// In production, this would query the user's verification status from database

export async function GET(request: NextRequest) {
  try {
    // TODO: Get user ID from auth token and check database
    // const userId = getUserIdFromToken(request);
    // const user = await db.users.findById(userId);
    // return NextResponse.json({
    //   verified: user?.aadhaarVerified || false,
    //   verifiedAt: user?.aadhaarVerifiedAt,
    // });

    // For now, return not verified (implement database check later)
    return NextResponse.json({
      verified: false,
      verifiedAt: null,
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
