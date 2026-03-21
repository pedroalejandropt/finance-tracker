import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail } from '@/lib/auth-dynamo';
import { createVerificationToken } from '@/lib/email-verification';
import { sendVerificationEmail } from '@/lib/mailer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : null;

    if (!email) {
      return NextResponse.json({ success: true });
    }

    // Prevent email enumeration — always return success
    const user = await findUserByEmail(email).catch(() => null);
    if (!user) {
      return NextResponse.json({ success: true });
    }

    const token = await createVerificationToken(email);
    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
    const verifyUrl = `${baseUrl}/api/auth/verify-email?email=${encodeURIComponent(email)}&token=${token}`;

    await sendVerificationEmail(email, verifyUrl).catch(() => {
      // Non-fatal — SMTP may not be configured
    });
  } catch {
    // Non-fatal — always return success to prevent enumeration
  }

  return NextResponse.json({ success: true });
}
