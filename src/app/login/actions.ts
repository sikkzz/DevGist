'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// 로그인 (ADR-0010). 비밀번호 일치 시 auth 쿠키(비밀 토큰) 설정 후 홈으로.
export async function login(formData: FormData) {
  const password = formData.get('password');
  const expected = process.env.APP_PASSWORD;
  const token = process.env.AUTH_TOKEN;

  if (!expected || !token || password !== expected) {
    redirect('/login?e=1');
  }

  (await cookies()).set('da', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1년
  });
  redirect('/');
}
