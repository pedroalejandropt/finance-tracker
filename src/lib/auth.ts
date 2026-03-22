import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GithubProvider from 'next-auth/providers/github';
import bcrypt from 'bcryptjs';
import { loginSchema } from './auth-schemas';
import { findUserByEmail } from './auth-dynamo';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // Demo account — always available for E2E tests and local development
        if (email === 'demo@financialtracker.com' && password === 'demo123') {
          return { id: 'demo', email, name: 'Demo User' };
        }

        // Real users — require DynamoDB
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
          return null;
        }

        const user = await findUserByEmail(email);
        if (!user) return null;

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) return null;

        const dbUser = user as { emailVerified?: boolean } & typeof user;
        const emailVerified = dbUser.emailVerified === false ? false : true;

        return {
          id: user.userId,
          email: user.email,
          name: user.name,
          emailVerified,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      // Only create DynamoDB record for OAuth users (not credentials)
      if (account?.provider !== 'credentials' && user.email) {
        if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
          try {
            const { findUserByEmail: findUser, createUser } = await import('./auth-dynamo');
            const existing = await findUser(user.email);
            if (!existing) {
              await createUser({
                userId: user.email,
                email: user.email,
                profile: user.email,
                name: user.name || user.email,
                passwordHash: '', // OAuth users have no password
                createdAt: new Date().toISOString(),
              });
            }
          } catch {
            // Non-fatal — user can still sign in even if DynamoDB write fails
          }
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.emailVerified = (user as { emailVerified?: boolean }).emailVerified ?? true;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.emailVerified = (token.emailVerified as boolean) ?? true;
      }
      return session;
    },
  },
};
