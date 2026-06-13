import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import { Suspense } from 'react';

import { getSessionUser } from '@/lib/auth';

import { logout } from './logout-action';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'DevGist',
  description: '개발자 인사이트 RSS 리더 (개인용)',
  // 개인 이용 기본 — 검색 비노출 (PROJECT_ROOT 제약 3)
  robots: { index: false, follow: false },
};

// 모바일 네이티브 느낌 — 주소창(theme-color)을 배경과 맞추고, 폼 컨트롤/스크롤바가 다크모드 따르게.
// width/initial-scale은 Next 기본값(device-width, 1)을 그대로 사용. 확대 잠금(user-scalable=no)은
// 접근성 안티패턴이라 쓰지 않음 — input 확대는 폰트 16px로 해결(globals.css).
export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
};

// 세션 조회(쿠키+DB)를 Suspense로 분리 — 레이아웃이 navigation을 막지 않게 해
// 페이지의 loading.tsx가 즉시 뜨도록 한다.
async function HeaderAuth() {
  const user = await getSessionUser();
  if (!user) return null;
  return (
    <form action={logout}>
      <button
        type="submit"
        className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
      >
        로그아웃
      </button>
    </form>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
          <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              DevGist
            </Link>
            <Suspense fallback={null}>
              <HeaderAuth />
            </Suspense>
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
