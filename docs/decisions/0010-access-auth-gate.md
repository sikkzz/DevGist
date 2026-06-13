# ADR-0010: 접근 인증 — DB 계정 로그인 (회원가입 없음)

> **상태**: Accepted
> **날짜**: 2026-06-07
> **결정자**: @sikkzz (with Claude)
> **관련 문서**: [ADR-0001](./0001-rss-aggregator-direction.md), [ADR-0009](./0009-personalized-ranking.md)

---

## 맥락 (Context)

배포된 `dev-gist.vercel.app`가 **누구나 URL로 접근 가능**했다. 문제:

1. 모은 글 **본문 전문이 공개**로 노출 (개인 사적 이용 전제가 깨짐 — [ADR-0001] 법적 정당성).
2. [ADR-0009] 개인화 칩(`회사·<스택>` 등)이 **회사 스택을 공개로 누설**.

`noindex`는 검색 비노출일 뿐 **접근 차단이 아니다**. 제약 #3("공개 시 인증 게이트")을 구현해야 한다.

## 결정 (Decision)

**DB 계정(아이디+비번) 로그인** — 회원가입 없음, 본인 1계정. env 시크릿 불필요.

- 스키마: `User`(username unique, passwordHash) / `Session`(id=쿠키 토큰, userId, expiresAt). 계정·세션이 DB에 있어 **Vercel env 설정 0**.
- 계정 시드: gitignore된 `config/account.local.json` → `pnpm seed:account`로 upsert(비번은 scrypt 해시, 의존성 X). 같은 Neon이라 prod에도 즉시 반영.
- `/login`: 아이디+비번 폼 → Server Action이 DB 대조(scrypt verify) → `Session` 생성 + httpOnly 쿠키 `sid`(1년) → 홈.
- 게이트 2단(Next 문서 권장 패턴): **Proxy**(`src/proxy.ts`, Next16 middleware→proxy)는 `sid` 쿠키 **존재만** 빠르게 보고 없으면 `/login`(edge, DB 안 씀). **페이지의 `requireAuth()`** 가 실제 세션을 DB로 검증(node) — 위조 쿠키 차단.
- 로그아웃: 세션 행 삭제 + 쿠키 제거.

## 이유 / 트레이드오프

- **얻는 것**: "진짜 로그인"(계정 관리), **env/Vercel 설정 없음**(DB로 일원화), 폰에서 한 번 로그인 후 쿠키 유지. scrypt/세션/proxy 학습.
- **포기하는 것**: 페이지마다 `requireAuth()` 호출(보호 페이지 2개라 경미). 단일 계정(다중 사용자 X). 세션 즉시 무효화는 행 삭제로.

## 검토한 대안

| 대안                            | 장점                         | 단점                         | 결정                |
| ------------------------------- | ---------------------------- | ---------------------------- | ------------------- |
| A. DB 계정 + 세션 쿠키          | 진짜 로그인, env 0, 본인관리 | 페이지별 requireAuth         | **채택**            |
| B. env 단일 비밀번호 + 쿠키토큰 | 코드 더 적음                 | env 2개·Vercel 설정 번거로움 | 폐기(사용자 피드백) |
| C. Vercel Deployment Protection | 코드 0                       | Vercel 로그인 묶임           | 보류                |
| D. Auth.js 등 본격 인증         | 다중/OAuth                   | 개인용엔 과함                | 불필요              |

## 결과 / 영향

- 스키마 `User`/`Session`(+마이그레이션), `src/lib/auth.ts`, `src/proxy.ts`, `src/app/login/(page,actions)`, `logout-action.ts`, `seed-account.mjs`.
- `/api/cron/poll`·`/api/admin/*`는 Bearer 인증 유지(게이트 제외) — GitHub Actions가 쿠키 없이 호출.
- **배포 시 env 추가 불필요.** 계정은 `pnpm seed:account` 한 번(같은 DB).

## 재검토 트리거

- 가족/지인 공유가 필요해지면 → 다중 사용자 인증(D) 검토.
