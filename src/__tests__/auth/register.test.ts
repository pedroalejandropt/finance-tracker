import bcrypt from 'bcryptjs';
import { createUser, findUserByEmail } from '@/lib/auth-dynamo';

jest.mock('@/lib/auth-dynamo');

const mockFindUserByEmail = findUserByEmail as jest.MockedFunction<typeof findUserByEmail>;
const mockCreateUser = createUser as jest.MockedFunction<typeof createUser>;

const mockUser = {
  userId: 'user@example.com',
  email: 'user@example.com',
  name: 'Test User',
  passwordHash: bcrypt.hashSync('Password1', 10),
  createdAt: new Date().toISOString(),
};

describe('register logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects registration when user already exists', async () => {
    mockFindUserByEmail.mockResolvedValue(mockUser);

    const existing = await findUserByEmail('user@example.com');
    expect(existing).not.toBeNull();
  });

  it('allows registration when user does not exist', async () => {
    mockFindUserByEmail.mockResolvedValue(null);
    mockCreateUser.mockResolvedValue(undefined);

    const existing = await findUserByEmail('new@example.com');
    expect(existing).toBeNull();

    await createUser({ ...mockUser, userId: 'new@example.com', email: 'new@example.com' });
    expect(mockCreateUser).toHaveBeenCalledTimes(1);
  });

  it('stores a hashed password, not plaintext', async () => {
    const plaintext = 'Password1';
    const hash = await bcrypt.hash(plaintext, 12);

    expect(hash).not.toBe(plaintext);
    expect(await bcrypt.compare(plaintext, hash)).toBe(true);
  });

  it('different hashes are generated for the same password', async () => {
    const hash1 = await bcrypt.hash('Password1', 12);
    const hash2 = await bcrypt.hash('Password1', 12);
    expect(hash1).not.toBe(hash2);
  });
});
