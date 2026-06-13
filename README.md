# DevGist

> **Dev + Gist** — 개발자 인사이트를 한곳에서.
> 빅테크·개인 테크 블로그의 글을 RSS/Atom으로 모아, 출퇴근길에 휴대폰으로 **전문(full content) 그대로** 읽는 개인용 리더.

DevGist는 흩어진 좋은 기술 글을 한곳에 모아 **원문으로 넘어가는 번거로움 없이** 읽기 위한 도구입니다. 요약 서비스가 아니라, 본문을 **손실 없이 보존**해 그대로 보여주는 데 초점을 둡니다.

> ⚠️ **개인용 도구입니다.** 배포본은 인증 게이트로 보호되고 검색엔진에 노출되지 않습니다(`noindex`). 이 저장소는 **무엇을 어떻게 만들었는지 기록을 공유**하기 위해 공개합니다.

---

## 왜 만들었나

- **읽기 마찰 제거** — 여러 블로그를 돌아다니지 않고, 한 화면에서 본문 전문을 바로 읽는다.
- **학습 아카이브** — 읽은 글을 읽음/북마크로 정리해 다시 찾는다.
- **개인화** — 시장 전체가 아니라 _내가 보고/해볼 만한_ 글로 좁혀서 본다(규칙 기반 스코어링).
- **직접 운영하는 풀스택 경험** — Next.js 풀스택 + 서버리스 DB + 스케줄링(cron) + 콘텐츠 수집 파이프라인을 설계·운영한다.

## 핵심 원칙

1. **본문 전문 무손실 보존** — 임의 요약/압축 금지. "추출"은 하되 "요약"은 하지 않는다. ([ADR-0001](docs/decisions/0001-rss-aggregator-direction.md))
2. **크롤러가 아닌 수집기(aggregator)** — RSS/Atom 정식 경로로 수집. 무단 스크래핑이 본진이 아니다.
3. **개인 이용 기본** — 공개 시 인증 게이트 + `noindex`로 검색 비노출. ([ADR-0010](docs/decisions/0010-access-auth-gate.md))

## 주요 기능

- **수집 파이프라인** — RSS/Atom 파싱 → `content:encoded` 우선, 부실하면 `@mozilla/readability`로 원문 본문 추출 → 실패 시 원문 링크 fallback. ([spec](docs/specs/feature-collection-pipeline.md))
- **안전한 본문 렌더링** — 신뢰할 수 없는 HTML을 sanitize(코드/이미지/SVG 다이어그램 보존, 스크립트·우회 차단). ([ADR-0007](docs/decisions/0007-untrusted-html-sanitize.md))
- **주제 분류** — 키워드 사전 기반으로 글을 프론트엔드/백엔드/인프라/AI 등으로 태깅. ([ADR-0008](docs/decisions/0008-topic-classification.md))
- **개인화 추천** — 회사 스택·학습 우선순위 프로필로 글을 점수화·정렬(추천순). 프로필 데이터는 비공개. ([ADR-0009](docs/decisions/0009-personalized-ranking.md))
- **리더 UX** — 읽음/북마크 상태, 무한 스크롤, 다중 주제 필터, 모바일 친화 UI. ([spec](docs/specs/feature-reader-ui.md) · [읽음 상태](docs/specs/feature-read-state.md))
- **접근 인증 게이트** — 회원가입 없는 단일 계정 로그인(세션 쿠키). ([ADR-0010](docs/decisions/0010-access-auth-gate.md))

## 기술 스택

| 영역       | 선택                                                  | 근거                                                        |
| ---------- | ----------------------------------------------------- | ----------------------------------------------------------- |
| 프레임워크 | Next.js 16 App Router (풀스택 단일 앱)                | [ADR-0002](docs/decisions/0002-nextjs-fullstack.md)         |
| 호스팅     | Vercel                                                | [ADR-0003](docs/decisions/0003-hosting-vercel.md)           |
| DB         | Neon (Serverless Postgres)                            | [ADR-0004](docs/decisions/0004-db-neon.md)                  |
| ORM        | Prisma 7 + `@prisma/adapter-neon`                     | [ADR-0005](docs/decisions/0005-orm-prisma.md)               |
| 수집 크론  | GitHub Actions cron → `/api/cron/poll`                | [ADR-0006](docs/decisions/0006-cron-github-actions.md)      |
| 본문 추출  | `@mozilla/readability` + `linkedom` + `sanitize-html` | [ADR-0001](docs/decisions/0001-rss-aggregator-direction.md) |

## 아키텍처

```
GitHub Actions (cron, 하루 2회)
        │  Bearer CRON_SECRET
        ▼
/api/cron/poll ──▶ poll ──▶ parse(RSS/Atom) ──▶ extract(본문) ──▶ ingest(분류·개인화·dedup)
                                                                         │
                                                                         ▼
                                                                  Neon Postgres
                                                                         │
                                                          (인증 게이트) ▼
                                                              리더 UI (Next.js)
```

- 수집은 **GitHub Actions cron**이 엔드포인트를 호출하는 방식(서버리스에 상주 프로세스 없음).
- 글 적재 시 **주제 분류 + 개인화 점수**를 함께 계산해 저장 → 읽을 때는 DB만 조회.
- 모든 결정의 상세 사유는 [`docs/decisions`](docs/decisions)(ADR), 기능 스펙은 [`docs/specs`](docs/specs)에 기록.

## 로컬 실행

> Prisma 7은 **Node 22.12+** 가 필요합니다.

```bash
# 1) 의존성
pnpm install

# 2) 환경변수 — .env.example 복사 후 값 채우기 (Neon DB URL, CRON_SECRET)
cp .env.example .env

# 3) DB 스키마 적용
pnpm prisma migrate deploy

# 4) 피드 시드 (큐레이션된 RSS 피드 목록)
pnpm seed:feeds

# 5) (선택) 개인화 프로필 / 로그인 계정 시드
#    config/*.example.json → config/*.local.json 로 채운 뒤
pnpm seed:profile
pnpm seed:account

# 6) 개발 서버
pnpm dev
```

검증: `pnpm lint` · `pnpm typecheck` · `pnpm build`

## 문서

- **설계 결정(ADR)**: [`docs/decisions`](docs/decisions) — 방향·스택·보안 등 10건
- **기능 스펙**: [`docs/specs`](docs/specs) — 수집 파이프라인 / 리더 UI / 읽음 상태

## 라이선스

[MIT](LICENSE) © 2026 JunSik Kim
