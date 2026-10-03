import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { UserRole } from '@/types';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  avatar: string;
  organizationId: string;
  createdAt: string;
  resetToken?: string | null;
  resetTokenExpiry?: number | null;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Memory cache fallback for ultra-fast lookups
let inMemoryUsers: UserRecord[] | null = null;

function ensureDataDirectoryExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getInitialSeededUsers(): UserRecord[] {
  const salt = bcrypt.genSaltSync(10);

  return [
    {
      id: 'USR-0001',
      name: 'Furkh',
      email: 'furkh@flowmind.ai',
      passwordHash: bcrypt.hashSync('flowmind2026!', salt),
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      organizationId: 'ORG-01',
      createdAt: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'USR-0002',
      name: 'Aniket Sahu',
      email: 'aniket@flowmind.ai',
      passwordHash: bcrypt.hashSync('flowmind2026!', salt),
      role: 'MANAGER',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aniket@flowmind.ai',
      organizationId: 'ORG-01',
      createdAt: new Date('2026-01-15').toISOString(),
    },
    {
      id: 'USR-0003',
      name: 'Sarah Connor',
      email: 'sarah@flowmind.ai',
      passwordHash: bcrypt.hashSync('flowmind2026!', salt),
      role: 'EMPLOYEE',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah@flowmind.ai',
      organizationId: 'ORG-01',
      createdAt: new Date('2026-02-01').toISOString(),
    },
  ];
}

function loadUsersFromDisk(): UserRecord[] {
  if (inMemoryUsers) return inMemoryUsers;

  try {
    ensureDataDirectoryExists();
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      inMemoryUsers = JSON.parse(data);
      return inMemoryUsers || [];
    }
  } catch (err) {
    console.error('[DB] Error loading users from disk:', err);
  }

  // Seed default users if no file exists
  const initial = getInitialSeededUsers();
  saveUsersToDisk(initial);
  return initial;
}

function saveUsersToDisk(users: UserRecord[]): void {
  inMemoryUsers = users;
  try {
    ensureDataDirectoryExists();
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Error saving users to disk:', err);
  }
}

export const db = {
  findUserByEmail(email: string): UserRecord | undefined {
    const users = loadUsersFromDisk();
    const normalized = email.trim().toLowerCase();
    return users.find((u) => u.email.toLowerCase() === normalized);
  },

  findUserById(id: string): UserRecord | undefined {
    const users = loadUsersFromDisk();
    return users.find((u) => u.id === id);
  },

  createUser(data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
  }): { user: Omit<UserRecord, 'passwordHash'>; error?: string } {
    const normalizedEmail = data.email.trim().toLowerCase();
    const existing = this.findUserByEmail(normalizedEmail);
    if (existing) {
      return { user: null as any, error: 'An account with this email already exists.' };
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(data.password, salt);

    const newUser: UserRecord = {
      id: `USR-${Date.now().toString().slice(-6)}`,
      name: data.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: data.role || 'EMPLOYEE',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(normalizedEmail)}`,
      organizationId: 'ORG-01',
      createdAt: new Date().toISOString(),
    };

    const users = loadUsersFromDisk();
    users.push(newUser);
    saveUsersToDisk(users);

    const { passwordHash: _, ...sanitizedUser } = newUser;
    return { user: sanitizedUser };
  },

  verifyPassword(plainPassword: string, passwordHash: string): boolean {
    if (!plainPassword || !passwordHash) return false;
    return bcrypt.compareSync(plainPassword, passwordHash);
  },

  createResetToken(email: string): { token: string; error?: string } {
    const user = this.findUserByEmail(email);
    if (!user) {
      return { token: '', error: 'No account found with this email address.' };
    }

    const token = `RESET-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const expiry = Date.now() + 60 * 60 * 1000; // 1 hour

    user.resetToken = token;
    user.resetTokenExpiry = expiry;

    const users = loadUsersFromDisk();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx !== -1) {
      users[idx] = user;
      saveUsersToDisk(users);
    }

    return { token };
  },

  resetPassword(token: string, newPassword: string): { success: boolean; error?: string } {
    const users = loadUsersFromDisk();
    const user = users.find(
      (u) => u.resetToken === token && u.resetTokenExpiry && u.resetTokenExpiry > Date.now()
    );

    if (!user) {
      return { success: false, error: 'Invalid or expired password reset link.' };
    }

    const salt = bcrypt.genSaltSync(10);
    user.passwordHash = bcrypt.hashSync(newPassword, salt);
    user.resetToken = null;
    user.resetTokenExpiry = null;

    saveUsersToDisk(users);
    return { success: true };
  },
};
