import { NextRequest, NextResponse } from 'next/server';
import { validateVerificationToken, markEmailVerified } from '@/lib/email-verification';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  if (!email || !token) {
    return NextResponse.redirect(new URL('/login?verify-error=1', request.url));
  }

  try {
    const valid = await validateVerificationToken(email, token);
    if (!valid) {
      return NextResponse.redirect(new URL('/login?verify-error=1', request.url));
    }

    await markEmailVerified(email);
    return NextResponse.redirect(new URL('/login?verified=1', request.url));
  } catch {
    return NextResponse.redirect(new URL('/login?verify-error=1', request.url));
  }
}
