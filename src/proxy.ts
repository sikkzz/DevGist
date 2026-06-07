import { type NextRequest, NextResponse } from 'next/server';

// 접근 게이트 (ADR-0010, Next 16 middleware→proxy).
// 빠른 "낙관적 체크"만: 세션 쿠키(sid)가 아예 없으면 /login으로.
// 실제 유효성(DB 세션 조회)은 페이지의 requireAuth가 검증 — edge에서 DB 안 씀.
// login·api·정적자원은 matcher 제외(api는 Bearer 자체 인증).
export function proxy(request: NextRequest) {
  if (request.cookies.has('sid')) {
    return NextResponse.next();
  }
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!login|api|_next/static|_next/image|favicon.ico|.*\\.).*)'],
};
