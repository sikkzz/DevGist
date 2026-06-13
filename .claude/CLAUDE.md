# CLAUDE.md

이 파일은 Claude Code가 이 저장소에서 작업할 때 참조하는 가이드입니다.
(Trailog `.claude/CLAUDE.md`를 기반으로 DevGist에 맞게 적응시킴)

## 프로젝트 개요

**DevGist** — 개발자 인사이트 **RSS 리더**

- 빅테크·개인 테크 블로그 글을 RSS/Atom으로 모아, 출퇴근길에 휴대폰으로 **전문(full content) 그대로** 읽는 **개인용** 도구
- 자세한 컨텍스트: `docs/PROJECT_ROOT.md` 참고 (새 세션 시작 시 필독)
- 본 프로젝트는 **학습 목적**이며, 단순히 동작하는 코드보다 **의도적 학습**과 **이유 설명**이 더 중요함

## 절대 어기지 않는 제약 (1순위 가치)

1. **본문 전문 무손실 보존** — 원문이 아니면 임의 요약/압축 금지. "추출"은 OK, "요약"은 금지. ([ADR-0001](../docs/decisions/0001-rss-aggregator-direction.md))
2. **크롤러 아님** — RSS/Atom 정식 수집. 무단 스크래핑이 본진 아님.
3. **개인 이용 기본** — 공개 시 인증 게이트 또는 `noindex`로 검색 비노출.

## 개발자 컨텍스트

- 상세 개발자 컨텍스트(경력·스택·학습 우선순위)는 비공개 내부 문서(docs/PROJECT_ROOT.md) 참고
- 모를 수 있는 패턴/개념/인프라 작업은 짧게라도 친절한 설명을 곁들일 것
- 코드만 작성하지 말고, **왜 그렇게 하는지** 같이 설명할 것

## 협업 규칙

### 코드 작성 시

1. **설명을 먼저, 코드를 나중에** — 무엇을 왜 만드는지 먼저 말하고 코드 작성
2. **새로운 개념이 나오면 짧게라도 설명** — 모를 가능성이 있는 패턴/라이브러리는 한두 줄 설명 곁들이기
3. **대안이 있으면 트레이드오프 알려주기** — "이 방법도 있지만 이 프로젝트엔 X가 더 맞음" 식
4. **TypeScript strict 모드 가정** — `any` 남발 금지, 타입 명확히

### 의사결정 시

1. **모르면 묻기** — 추측 말고 명확히 질문. **추정 답변 금지** — 실제 코드/파일을 read해서 사실 기반으로 답
2. **PROJECT_ROOT / ADR의 결정사항을 우선** — 큰 방향은 이미 정해진 것. 벗어나는 제안 시 명시적으로 알리기
3. **안티 패턴 회피** — 새 언어/프레임워크 충동적 도입 금지, 처음부터 과도한 추상화 금지, 측정 전 최적화 금지

### 작업 흐름

1. 큰 작업은 **작은 단위로 쪼개서** 진행
2. 한 번에 너무 많은 파일을 만들지 말고, **단계별로** 만들고 검증
3. 의미 있는 단위마다 **commit message 제안** — Conventional Commits 형식: **prefix는 영어** (`docs:` / `chore:` / `feat:` / `fix:` / `refactor:` / `build:` / `ci:` / `test:` / `style:` / `perf:`) + **본문은 한글**
4. **commit/push 자동 실행 X** — 변경 요약을 보여주고 **본인 OK 받은 뒤** 실행 (검증 명령 lint/typecheck는 먼저 돌려도 됨)
5. **spec-as-we-go** — 스펙을 미리 다 짜지 않음. 기능 착수 시 `docs/specs/`에 가볍게 작성, 결정은 `docs/decisions/` ADR, 새 개념은 `docs/learnings/`

### 수정 전 확인

코드를 수정하기 전에 항상:

1. **대상 파일 read** — 작성한 적 없거나 컨텍스트가 흐려진 파일은 먼저 read. 머릿속 기억에 의존 X.
2. **인접 컨텍스트 확인** — 같은 디렉토리의 형제 파일, 관련 schema/lib, 사용하는 곳(import 사이트)
3. **파급 범위 파악** — DB 마이그레이션(`prisma migrate`)이 필요한지, 라우트/응답 contract가 깨지는지, 환경변수 추가가 필요한지

## 코드 품질 기준

모든 코드 변경은 아래 5개 기준을 만족해야 한다.

1. **가독성 우선** — 짧은 코드보다 읽기 쉬운 코드. 복잡한 로직은 함수/컴포넌트로 분리
2. **변경 범위 최소화** — 하나의 수정은 하나의 문제만. 관련 없는 리팩토링은 별도 commit
3. **지역적 이해 가능성** — 파일 하나만 읽어도 동작 이해. 숨겨진 side effect 금지
4. **명시성** — magic number/string 금지(의미 있는 상수로), 의미 있는 변수명(`d`, `tmp`, `data2` 금지)
5. **일관성** — 새 패턴 도입보다 기존 코드 스타일 우선. 이미 있는 helper/패턴 활용

## 문서화 원칙 (중요)

본 프로젝트는 **1인 풀팀 + 문서 자동화** 방식으로 운영됨.

- **본인(사용자)은 문서를 직접 쓰지 않음.** 모든 마크다운 문서는 Claude가 작성한다.
- 본인은 **프롬프팅, 리뷰, 수정 요청, 추가 학습 요청**만 담당한다.
- 따라서 Claude는 적절한 타이밍에 **먼저 문서 작성을 제안**해야 한다.

### Claude가 먼저 제안해야 하는 상황

| 상황                                | 작성할 문서                    | 템플릿                             |
| ----------------------------------- | ------------------------------ | ---------------------------------- |
| 새 기능 만들기 시작할 때            | `docs/specs/feature-xxx.md`    | `docs/templates/spec.md`           |
| 기술적 의사결정이 필요할 때         | `docs/decisions/XXXX-xxx.md`   | `docs/templates/adr.md`            |
| 본인이 처음 보는 개념이 등장했을 때 | `docs/learnings/topic-name.md` | `docs/templates/learning-note.md`  |
| 기능 완료 후 캡처가 모였을 때       | `docs/screens/feature-xxx.md`  | `docs/templates/screen-catalog.md` |

**문서 작성 규칙**: 템플릿 사용 / 관련 Spec·ADR·학습노트 서로 링크(상대 경로) / 같은 토픽 추가 시 새 파일 X·기존 파일에 날짜 헤더로 추가 / 파일명 kebab-case / ADR 번호 4자리 0패딩.

## 확정 기술 스택 (ADR 박제)

| 항목       | 선택                                                                        | ADR                                                        |
| ---------- | --------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 프레임워크 | Next.js 16 App Router (풀스택 단일 앱, 별도 백엔드 X)                       | [0002](../docs/decisions/0002-nextjs-fullstack.md)         |
| 호스팅     | Vercel Hobby (무료)                                                         | [0003](../docs/decisions/0003-hosting-vercel.md)           |
| DB         | Neon (Serverless Postgres, pooled)                                          | [0004](../docs/decisions/0004-db-neon.md)                  |
| ORM        | Prisma 7 + `@prisma/adapter-neon`                                           | [0005](../docs/decisions/0005-orm-prisma.md)               |
| 수집 크론  | GitHub Actions cron → `/api/cron/poll`                                      | [0006](../docs/decisions/0006-cron-github-actions.md)      |
| 본문 추출  | `@mozilla/readability` + `content:encoded` 우선, 실패 시 원문 링크 fallback | [0001](../docs/decisions/0001-rss-aggregator-direction.md) |

## 환경 gotcha (중요)

- **시스템 기본 Node(20.x)는 Prisma 7(요구 22.12+)에 미달.** `nvm use`는 `~/.npmrc` prefix 충돌로 막힘.
- → node/pnpm/prisma 명령은 **반드시 아래 PATH prefix 후 실행**:
  ```bash
  export PATH="$HOME/.nvm/versions/node/v22.18.0/bin:$PATH"
  ```
- **Prisma 7 신규 패턴**:
  - schema `datasource.url` 제거 → `prisma.config.ts`에 위치 (CLI/마이그레이션은 `DIRECT_URL` 직결 사용)
  - 런타임 `PrismaClient`에 driver adapter 필수: `new PrismaClient({ adapter: new PrismaNeon({ connectionString }) })` — pooled `DATABASE_URL` 사용
  - client import 경로: `@/generated/prisma/client` (생성물에 `index.ts` 없음)
  - `src/generated/prisma`는 gitignore (커밋 X)
- **환경변수**: `DATABASE_URL`(pooled, `-pooler` 호스트) / `DIRECT_URL`(direct) / `CRON_SECRET`. `.env`는 gitignore, 형식은 `.env.example` 참고.

## 검증 명령어

코드 수정 후 반드시 검증. 에러 있으면 완료로 간주 X. (PATH prefix 선행 필수)

```bash
export PATH="$HOME/.nvm/versions/node/v22.18.0/bin:$PATH"
pnpm lint
pnpm typecheck
pnpm build            # CI는 build 시 더미 DATABASE_URL 필요
pnpm seed:feeds       # 임시 피드 시드 (피드 관리 UI 전까지)
pnpm sync:notion:dry  # 문서 Notion sync 검증 (NOTION_TOKEN/PARENT_PAGE_ID 필요)
```

husky 4계층: pre-commit(lint-staged) / commit-msg(commitlint, Conventional Commits) / pre-push(typecheck).

## 디렉토리 구조 (현재)

```
DevGist/
├── src/
│   ├── app/
│   │   └── api/cron/poll/route.ts   # 수집 크론 엔드포인트 (Bearer CRON_SECRET)
│   ├── lib/
│   │   ├── prisma.ts                # Prisma 싱글톤 (Neon adapter)
│   │   └── feeds/                   # 수집 파이프라인
│   │       ├── constants.ts         # 임계값/동시성/UA 상수
│   │       ├── parse.ts             # rss-parser → 정규화 ParsedItem
│   │       ├── extract.ts           # readability 추출 + fallback
│   │       ├── ingest.ts            # guid dedup + 동시성 적재
│   │       └── poll.ts              # active 피드 격리 순회
│   └── generated/prisma/            # Prisma 생성물 (gitignore)
├── prisma/
│   ├── schema.prisma                # Feed / Article / Read
│   └── migrations/
├── scripts/
│   ├── seed-feeds.mjs               # 임시 피드 시드
│   └── sync-to-notion.mjs           # 문서 Notion publish
├── docs/
│   ├── PROJECT_ROOT.md              # 북극성 문서 (세션 시작 시 먼저 읽기)
│   ├── specs/ decisions/ learnings/ screens/ templates/
├── .github/workflows/               # ci / notion-sync / poll-feeds
└── .claude/CLAUDE.md                # 이 파일
```

## 커뮤니케이션 톤

- 한국어로 응답
- 너무 격식체보다는 친근한 톤
- 칭찬/아부는 최소화, 실용적인 정보 우선
- 모르면 모른다고, 추측이면 추측이라고 명시 (사실 기반 우선 — 실제 코드를 read 후 답변)
