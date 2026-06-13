# ADR-0005: ORM — Prisma 7

> **상태**: Accepted
> **날짜**: 2026-06-03
> **결정자**: @sikkzz (with Claude)
> **관련 문서**: [ADR-0004](./0004-db-neon.md)

---

## 맥락 (Context)

Neon Postgres에 접근할 ORM이 필요하다. 후보는 Prisma, Drizzle, TypeORM, Kysely 등. 개인 도구라 빠른 개발·강한 타입 안전성을 우선한다. (Trailog에서는 회사 친숙도 정복 목적으로 TypeORM을 골랐다.)

## 결정 (Decision)

**선택**: **Prisma 7** — 새 `prisma-client` 제너레이터(ESM, custom output `src/generated/prisma`) + **`@prisma/adapter-neon`** 런타임 어댑터.

## 이유 / 트레이드오프

- **얻는 것**: TS 생태계에서 가장 널리 쓰여 레퍼런스가 풍부. 스키마 → 타입 자동 생성으로 타입 안전성·DX 강함. serverless 어댑터(Neon) 1st-party 지원. Trailog(TypeORM)와 함께 **두 ORM 모두 경험**.
- **포기하는 것**: Prisma 7은 schema `datasource.url` 제거 + 런타임 driver adapter 필수 등 신규 패턴이라 자료가 아직 적다. 쿼리 빌더 수준의 세밀한 SQL 제어는 Drizzle/Kysely보다 약함.

## 검토한 대안

| 대안       | 장점                           | 단점                               | 제외 이유                        |
| ---------- | ------------------------------ | ---------------------------------- | -------------------------------- |
| A. Prisma  | 실무 1위, 타입/DX, Neon 어댑터 | 7버전 신규 패턴 자료 적음          | **채택**                         |
| B. Drizzle | 가볍고 SQL-친화, edge 친화     | 마이그레이션/DX 성숙도 Prisma 미만 | DX·레퍼런스 우선                 |
| C. TypeORM | 회사 친숙(데코레이터)          | Trailog에서 이미 경험, ESM 이슈    | 두 ORM 경험 다양화 → Prisma 선택 |
| D. Kysely  | 타입세이프 쿼리빌더            | ORM 편의(관계 로딩 등) 약함        | 편의 우선                        |

## 결과 / 영향

- Prisma 7 변경점 반영:
  - 스키마 `datasource`에서 `url` 제거 → `prisma.config.ts`로 이동.
  - 런타임 `PrismaClient`에 driver adapter 필수 → `new PrismaClient({ adapter: new PrismaNeon({ connectionString }) })`.
  - 클라이언트 import 경로: `@/generated/prisma/client` (생성물에 `index.ts` 없음).
- 싱글톤(`src/lib/prisma.ts`)으로 dev HMR 커넥션 누수 방지.
- 스키마: `Feed` / `Article` / `Read` (상세는 `prisma/schema.prisma`).

## 재검토 트리거

- edge 런타임이 필요하거나 세밀한 SQL 제어가 빈번해질 때 → Drizzle/Kysely 재검토.

## 참고

- Prisma 7 `prisma-client` generator, driver adapters (`@prisma/adapter-neon`)
