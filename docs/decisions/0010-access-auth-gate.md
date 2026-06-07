# ADR-0010: 접근 인증 게이트 — 앱 비밀번호 + Proxy 쿠키

> **상태**: Accepted
> **날짜**: 2026-06-07
> **결정자**: @sikkzz (with Claude)
> **관련 문서**: [PROJECT_ROOT](../PROJECT_ROOT.md), [ADR-0001](./0001-rss-aggregator-direction.md), [ADR-0009](./0009-personalized-ranking.md)

---

## 맥락 (Context)

배포된 `dev-gist.vercel.app`가 **누구나 URL로 접근 가능**했다. 문제:

1. 모은 글 **본문 전문이 공개**로 노출 (개인 사적 이용 전제가 깨짐 — [ADR-0001] 법적 정당성).
2. [ADR-0009] 개인화 칩(`회사·nestjs` 등)이 **회사 스택을 공개로 누설**.
   `noindex`는 검색 비노출일 뿐 **접근 차단이 아니다**. 제약 #3("공개 시 인증 게이트")을 이제 구현해야 한다.

## 결정 (Decision)

**앱 단일 비밀번호 게이트**를 Next.js **Proxy**(구 middleware, Next 16 개명)로 구현.

- `src/proxy.ts`: 유효한 auth 쿠키(`da`)가 없으면 `/login`으로 리다이렉트. `login`·`api`·정적자원은 matcher 제외(api는 자체 Bearer 인증 유지).
- `/login`: 비밀번호 폼 → Server Action이 `APP_PASSWORD` 검증 → 일치 시 httpOnly 쿠키 `da = AUTH_TOKEN`(비밀, 1년) 설정 후 홈.
- env: `APP_PASSWORD`(입력값) / `AUTH_TOKEN`(쿠키에 담기는 랜덤 시크릿). 둘 다 Vercel env에 설정. fail-closed(토큰 미설정 시 전부 차단).

## 이유 / 트레이드오프

- **얻는 것**: 코드 소량으로 공개 접근 차단. 회사 정보·본문 노출 해소. 폰에서 한 번 로그인 → 쿠키로 유지. middleware/쿠키 학습.
- **포기하는 것**: 단일 비번(다중 사용자/권한 X). Proxy는 "optimistic check"용이라 풀 세션관리는 아님 — 개인용엔 충분. 쿠키 탈취 시 재사용 가능(개인용 수용).

## 검토한 대안

| 대안                            | 장점                        | 단점                            | 결정                 |
| ------------------------------- | --------------------------- | ------------------------------- | -------------------- |
| A. 앱 비밀번호 + Proxy 쿠키     | 코드 소량, 폰 UX 좋음, 학습 | 단일 비번                       | **채택**             |
| B. Vercel Deployment Protection | 코드 0                      | Vercel 로그인에 묶임, 공유 불가 | 보류(즉시 잠금 옵션) |
| C. 본격 인증(Auth.js 등)        | 다중 사용자/OAuth           | 개인용엔 과함                   | 불필요               |

## 결과 / 영향

- `src/proxy.ts`, `src/app/login/(page,actions)`, env 2개.
- `/api/cron/poll`·`/api/admin/*`는 기존 Bearer 인증 유지(게이트 제외) — GitHub Actions가 쿠키 없이 호출하므로.
- 배포 시 Vercel env에 `APP_PASSWORD`/`AUTH_TOKEN` 설정 필요.

## 재검토 트리거

- 가족/지인 공유가 필요해지면 → 다중 사용자 인증(C) 검토.
