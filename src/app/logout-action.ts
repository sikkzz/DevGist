'use server';

import { redirect } from 'next/navigation';

import { logout as clearSession } from '@/lib/auth';

export async function logout() {
  await clearSession();
  redirect('/login');
}
