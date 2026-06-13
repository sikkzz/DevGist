// 보관함 로딩 스켈레톤 (navigation 시 즉시 표시)
export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* 뷰 토글 */}
      <div className="mb-4 flex justify-center">
        <div className="h-9 w-40 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
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
