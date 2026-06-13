// 홈 목록 로딩 스켈레톤 (navigation 시 즉시 표시 — ADR 없음, UX 개선)
export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* 주제 탭 */}
      <div className="mb-3 flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-7 w-14 rounded-full bg-zinc-100 dark:bg-zinc-800" />
        ))}
      </div>
      {/* 정렬 토글 */}
      <div className="mb-3 flex justify-end">
        <div className="h-4 w-24 rounded bg-zinc-100 dark:bg-zinc-800" />
      </div>
      {/* 카드들 */}
      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="py-4">
            <div className="h-3 w-32 rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="mt-2 h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="mt-2 h-3 w-full rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="mt-1 h-3 w-2/3 rounded bg-zinc-100 dark:bg-zinc-800" />
          </li>
        ))}
      </ul>
    </div>
  );
}
