import { NextResponse } from 'next/server';
import { db } from '@/lib/auth/db';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please enter a valid work email address.' },
        { status: 400 }
      );
    }

    const { token, error } = db.createResetToken(email);

    if (error) {
      return NextResponse.json({ error }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Password reset instructions and token generated for ${email}.`,
      resetToken: token,
      resetLink: `/reset-password?token=${token}`,
    });
  } catch (err: any) {
    console.error('[API FORGOT PASSWORD ERROR]', err);
    return NextResponse.json(
      { error: 'Failed to process password reset request.' },
      { status: 500 }
    );
  }
}
