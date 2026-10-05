import { prisma } from '@/lib/prisma';
import { db, UserRecord } from '@/lib/auth/db';
import { UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  organizationId?: string;
  preferredLanguage?: string;
}

export const userService = {
  async findUserByEmail(email: string) {
    const normalized = email.trim().toLowerCase();
    try {
      const user = await prisma.user.findUnique({
        where: { email: normalized },
        include: { organization: true },
      });
      if (user) return user;
    } catch (err) {
      console.warn('[userService] Prisma query failed, falling back to file DB:', err);
    }
    // Fallback to file db
    const fileUser = db.findUserByEmail(normalized);
    if (!fileUser) return null;
    return {
      id: fileUser.id,
      organizationId: fileUser.organizationId || 'ORG-01',
      name: fileUser.name,
      email: fileUser.email,
      passwordHash: fileUser.passwordHash,
      role: fileUser.role as UserRole,
      status: 'ACTIVE' as UserStatus,
      avatar: fileUser.avatar,
      preferredLanguage: 'en',
      createdAt: new Date(fileUser.createdAt),
      updatedAt: new Date(fileUser.createdAt),
    };
  },

  async findUserById(id: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: { organization: true },
      });
      if (user) return user;
    } catch (err) {
      console.warn('[userService] Prisma query failed, falling back to file DB:', err);
    }
    const fileUser = db.findUserById(id);
    if (!fileUser) return null;
    return {
      id: fileUser.id,
      organizationId: fileUser.organizationId || 'ORG-01',
      name: fileUser.name,
      email: fileUser.email,
      passwordHash: fileUser.passwordHash,
      role: fileUser.role as UserRole,
      status: 'ACTIVE' as UserStatus,
      avatar: fileUser.avatar,
      preferredLanguage: 'en',
      createdAt: new Date(fileUser.createdAt),
      updatedAt: new Date(fileUser.createdAt),
    };
  },

  async createUser(data: CreateUserData) {
    const normalizedEmail = data.email.trim().toLowerCase();
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(data.password, salt);
    const orgId = data.organizationId || 'ORG-01';

    try {
      // Ensure organization exists
      await prisma.organization.upsert({
        where: { slug: 'flowmind-enterprise' },
        update: {},
        create: {
          id: orgId,
          name: 'FlowMind Enterprise',
          slug: 'flowmind-enterprise',
          domain: 'flowmind.ai',
          plan: 'ENTERPRISE',
        },
      });

      const newUser = await prisma.user.create({
        data: {
          organizationId: orgId,
          name: data.name.trim(),
          email: normalizedEmail,
          passwordHash,
          role: data.role || 'EMPLOYEE',
          status: 'ACTIVE',
          preferredLanguage: data.preferredLanguage || 'en',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(normalizedEmail)}`,
        },
      });

      const { passwordHash: _, ...sanitized } = newUser;
      return { user: sanitized };
    } catch (err: any) {
      console.warn('[userService] Prisma create user failed, trying file DB:', err);
      // Fallback file DB
      const result = db.createUser({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role as any,
      });

      if (result.error) return { user: null, error: result.error };
      return { user: result.user };
    }
  },

  async updateUserRole(userId: string, newRole: UserRole) {
    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { role: newRole },
      });
      return { user: updated };
    } catch (err: any) {
      return { user: null, error: err.message };
    }
  },

  async deactivateUser(userId: string) {
    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { status: 'INACTIVE' },
      });
      return { user: updated };
    } catch (err: any) {
      return { user: null, error: err.message };
    }
  },

  verifyPassword(plainPassword: string, passwordHash: string): boolean {
    if (!plainPassword || !passwordHash) return false;
    return bcrypt.compareSync(plainPassword, passwordHash);
  },
};
