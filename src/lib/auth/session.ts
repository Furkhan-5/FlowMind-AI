import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { UserRole } from '@/types';

export const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'flowmind_session';

const JWT_SECRET_STRING =
  process.env.JWT_SECRET || 'flowmind-ai-super-secret-enterprise-jwt-key-2026';

const secretKey = new TextEncoder().encode(JWT_SECRET_STRING);

export interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
  organizationId: string;
}

/**
 * Creates a signed JWT session token valid for 7 days
 */
export async function createToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

/**
 * Verifies a JWT session token in Edge runtime or Node.js
 */
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as SessionPayload;
  } catch (err) {
    return null;
  }
}

/**
 * Sets the HTTP-Only session cookie in Next.js Server Actions or Route Handlers
 */
export async function setSessionCookie(payload: SessionPayload): Promise<string> {
  const token = await createToken(payload);
  const cookieStore = cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  });

  return token;
}

/**
 * Clears the session cookie on logout
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
}

/**
 * Retrieves and verifies current user payload from request cookies
 */
export async function getCurrentUserFromSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;
  return await verifyToken(token);
}
