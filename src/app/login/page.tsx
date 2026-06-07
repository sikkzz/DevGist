import { login } from './actions';

export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const sp = await searchParams;
  const error = sp.e === '1';

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center">
      <h1 className="text-xl font-semibold">DevGist</h1>
      <p className="mt-1 text-sm text-zinc-500">개인용 — 비밀번호를 입력하세요.</p>
      <form action={login} className="mt-6 flex flex-col gap-2">
        <input
          type="password"
          name="password"
          autoFocus
          required
          placeholder="비밀번호"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
        {error && <p className="text-sm text-red-600">비밀번호가 올바르지 않습니다.</p>}
        <button
          type="submit"
          className="mt-1 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          들어가기
        </button>
      </form>
    </div>
  );
}
