import { type NextRequest, NextResponse } from 'next/server';

// 접근 인증 게이트 (ADR-0010, Next 16에선 middleware → proxy).
// 유효한 auth 쿠키가 없으면 /login으로 보냄. 페이지 라우트에만 적용
// (login·api·정적자원은 matcher에서 제외 — api는 자체 Bearer 인증).
export function proxy(request: NextRequest) {
  const expected = process.env.AUTH_TOKEN;
  const token = request.cookies.get('da')?.value;

  // 토큰 미설정(오설정)이거나 쿠키 불일치 → 로그인으로 (fail closed)
  if (expected && token === expected) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  // login·api·_next·정적파일(점 포함) 제외한 모든 페이지 경로
  matcher: ['/((?!login|api|_next/static|_next/image|favicon.ico|.*\\.).*)'],
};
