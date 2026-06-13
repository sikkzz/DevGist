import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

import { prisma } from '@/lib/prisma';

// 계정 인증 (ADR-0010). 비번 해시는 scrypt(의존성 X), 세션은 DB 행 + httpOnly 쿠키.

const COOKIE = 'sid';
const SESSION_DAYS = 365;

/** salt:scrypt(hex) 형식으로 해시. seed-account.mjs와 동일 포맷 유지. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const original = Buffer.from(hash, 'hex');
  return original.length === candidate.length && timingSafeEqual(original, candidate);
}

/** 세션 생성 + 쿠키 설정 */
export async function createSession(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  const session = await prisma.session.create({ data: { userId, expiresAt } });
  (await cookies()).set(COOKIE, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

/** 현재 세션의 사용자 (없거나 만료면 null). 요청 내 1회로 메모이즈(레이아웃+requireAuth 중복 제거). */
export const getSessionUser = cache(async () => {
  const sid = (await cookies()).get(COOKIE)?.value;
  if (!sid) return null;
  const session = await prisma.session.findUnique({ where: { id: sid }, include: { user: true } });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
});

/** 보호 페이지 진입점 — 미인증이면 /login으로. */
export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return user;
}

/** 로그아웃 — 세션 삭제 + 쿠키 제거. */
export async function logout() {
  const store = await cookies();
  const sid = store.get(COOKIE)?.value;
  if (sid) {
    await prisma.session.delete({ where: { id: sid } }).catch(() => {});
    store.delete(COOKIE);
  }
}
