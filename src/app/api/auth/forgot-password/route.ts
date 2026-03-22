import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail } from '@/lib/auth-dynamo';
import { createResetToken } from '@/lib/password-reset';
import { sendPasswordResetEmail } from '@/lib/mailer';
import { z } from 'zod';

const schema = z.object({ email: z.string().email() });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const { email } = parsed.data;

    // Always return success to avoid leaking which emails are registered
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json({ success: true });
    }

    const user = await findUserByEmail(email);
    if (user) {
      const token = await createResetToken(email);
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const resetUrl = `${baseUrl}/reset-password?email=${encodeURIComponent(email)}&token=${token}`;

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await sendPasswordResetEmail(email, resetUrl);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
