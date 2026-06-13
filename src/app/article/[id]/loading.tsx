// 글 상세 로딩 스켈레톤 (navigation 시 즉시 표시)
export default function Loading() {
  return (
    <article className="animate-pulse">
      <div className="h-4 w-12 rounded bg-zinc-100 dark:bg-zinc-800" />
      <div className="mt-4 h-7 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700" />
      <div className="mt-3 h-3 w-44 rounded bg-zinc-100 dark:bg-zinc-800" />
      <div className="mt-3 h-7 w-24 rounded bg-zinc-100 dark:bg-zinc-800" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className={`h-3 rounded bg-zinc-100 dark:bg-zinc-800 ${i % 3 === 2 ? 'w-2/3' : 'w-full'}`}
          />
        ))}
      </div>
    </article>
  );
}
