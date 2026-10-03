import { NextResponse } from 'next/server';
import { db } from '@/lib/auth/db';

export async function POST(request: Request) {
  try {
    const { token, newPassword, confirmPassword } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Password reset token is required.' },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match.' },
        { status: 400 }
      );
    }

    const { success, error } = db.resetPassword(token, newPassword);

    if (!success) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successful. You may now sign in with your new password.',
    });
  } catch (err: any) {
    console.error('[API RESET PASSWORD ERROR]', err);
    return NextResponse.json(
      { error: 'Failed to reset password.' },
      { status: 500 }
    );
  }
}
