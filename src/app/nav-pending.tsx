'use client';

import { useLinkStatus } from 'next/link';

// Link 내부에 두면 그 Link의 navigation pending 동안 스피너를 보여줌 (Next16 useLinkStatus).
// 탭·정렬 같은 same-route(searchParam) 이동은 loading.tsx가 안 떠서 이게 즉각 피드백을 준다.
export function NavPending({ className = '' }: { className?: string }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      aria-hidden
      className={`inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent align-middle opacity-60 ${className}`}
    />
  );
}
