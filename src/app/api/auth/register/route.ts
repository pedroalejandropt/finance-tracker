import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { registerSchema } from '@/lib/auth-schemas';
import { createUser, findUserByEmail } from '@/lib/auth-dynamo';
import { withRateLimit } from '@/lib/with-rate-limit';
import { createVerificationToken } from '@/lib/email-verification';
import { sendVerificationEmail } from '@/lib/mailer';

const SALT_ROUNDS = 12;

export const POST = withRateLimit(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const parsed = registerSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
      }

      const { name, email, password } = parsed.data;

      const existing = await findUserByEmail(email);
      if (existing) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      await createUser({
        userId: email,
        profile: name,
        email,
        name,
        passwordHash,
        createdAt: new Date().toISOString(),
      });

      try {
        const token = await createVerificationToken(email);
        const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
        const verifyUrl = `${baseUrl}/api/auth/verify-email?email=${encodeURIComponent(email)}&token=${token}`;
        await sendVerificationEmail(email, verifyUrl);
      } catch {
        // Non-fatal — SMTP may not be configured
      }

      return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
      console.error('Error creating account', error);
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }
  },
  { windowMs: 60_000, max: 5 }
);
