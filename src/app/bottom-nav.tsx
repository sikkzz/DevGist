'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// 최상위 목적지. 늘어나면(검색/피드관리 등) 여기 추가.
const TABS = [
  { href: '/', label: '홈', icon: HomeIcon },
  { href: '/library', label: '보관함', icon: BookmarkIcon },
] as const;

/**
 * 모바일 하단 고정 탭바.
 * - 글 상세(/article/*)·로그인에서는 숨김 — 몰입 읽기/로그인 공간 확보.
 * - iOS 홈 인디케이터 safe-area 만큼 하단 패딩.
 */
export function BottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith('/article/') || pathname === '/login') return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-3xl">
        {TABS.map((t) => {
          const active = t.href === '/' ? pathname === '/' : pathname.startsWith(t.href);
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] transition-colors ${
                active
                  ? 'text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'
              }`}
            >
              <Icon active={active} />
              <span className={active ? 'font-medium' : undefined}>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// 아이콘 — active면 채움, 아니면 외곽선 (별도 아이콘 라이브러리 의존 없이 인라인 SVG)
function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3 3 10v10a1 1 0 0 0 1 1h5v-6h6v6h5a1 1 0 0 0 1-1V10z" />
    </svg>
  );
}

function BookmarkIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 4h12a1 1 0 0 1 1 1v16l-7-4-7 4V5a1 1 0 0 1 1-1z" />
    </svg>
  );
}
