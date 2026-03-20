import bcrypt from 'bcryptjs';
import { findUserByEmail, DbUser } from '@/lib/auth-dynamo';

jest.mock('@/lib/auth-dynamo');

const mockFindUserByEmail = findUserByEmail as jest.MockedFunction<typeof findUserByEmail>;

const passwordHash = bcrypt.hashSync('Password1', 10);

const mockUser: DbUser = {
  userId: 'user@example.com',
  email: 'user@example.com',
  name: 'Test User',
  passwordHash,
  createdAt: new Date().toISOString(),
};

async function authorize(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return null;
  return { id: user.userId, email: user.email, name: user.name };
}

describe('authorize (login)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns user for valid credentials', async () => {
    mockFindUserByEmail.mockResolvedValue(mockUser);
    const result = await authorize('user@example.com', 'Password1');
    expect(result).toEqual({
      id: 'user@example.com',
      email: 'user@example.com',
      name: 'Test User',
    });
  });

  it('returns null for wrong password', async () => {
    mockFindUserByEmail.mockResolvedValue(mockUser);
    const result = await authorize('user@example.com', 'WrongPassword1');
    expect(result).toBeNull();
  });

  it('returns null for unknown email', async () => {
    mockFindUserByEmail.mockResolvedValue(null);
    const result = await authorize('unknown@example.com', 'Password1');
    expect(result).toBeNull();
  });

  it('returns the same null for wrong password and unknown email (no enumeration)', async () => {
    mockFindUserByEmail.mockResolvedValue(null);
    const unknown = await authorize('unknown@example.com', 'Password1');

    mockFindUserByEmail.mockResolvedValue(mockUser);
    const wrong = await authorize('user@example.com', 'WrongPassword1');

    expect(unknown).toBeNull();
    expect(wrong).toBeNull();
  });
});
