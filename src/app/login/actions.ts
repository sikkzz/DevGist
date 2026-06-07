'use server';

import { redirect } from 'next/navigation';

import { createSession, verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 로그인 (ADR-0010). 아이디/비번 DB 대조 → 세션 생성 후 홈. 회원가입 없음.
export async function login(formData: FormData) {
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  const user = username ? await prisma.user.findUnique({ where: { username } }) : null;
  if (!user || !verifyPassword(password, user.passwordHash)) {
    redirect('/login?e=1');
  }

  await createSession(user.id);
  redirect('/');
}
