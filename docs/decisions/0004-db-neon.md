# ADR-0004: DB — Neon (Serverless Postgres)

> **상태**: Accepted
> **날짜**: 2026-06-03
> **결정자**: @sikkzz (with Claude)
> **관련 문서**: [ADR-0003](./0003-hosting-vercel.md), [ADR-0005](./0005-orm-prisma.md)

---

## 맥락 (Context)

Vercel(서버리스) 위에서 도는 Next 풀스택 앱의 DB가 필요하다. 무료·개인 스케일 우선. AWS RDS 같은 상시 인스턴스는 서버리스 함수의 짧은 수명·다수 동시 연결과 궁합이 나쁘고, AWS 프리티어는 2025년부터 12개월 무료 → 6개월/크레딧 방식으로 바뀌어 장기 무료가 애매하다.

## 결정 (Decision)

**선택**: **Neon** 무료 티어 Postgres. **pooled connection** 문자열 + Prisma 싱글톤으로 서버리스 커넥션 고갈을 방지한다.

## 이유 / 트레이드오프

- **얻는 것**: serverless Postgres라 Vercel 함수와 궁합이 좋다(connection pooling, 빠른 cold start). 무료 티어로 개인 스케일 충분. Postgres라 Trailog와 DB 계열 일관.
- **포기하는 것**: 무료 티어의 storage/compute 한도, 일정 시간 미사용 시 스케일-투-제로로 인한 첫 쿼리 지연 가능.

## 검토한 대안

| 대안              | 장점                               | 단점                                | 제외 이유                         |
| ----------------- | ---------------------------------- | ----------------------------------- | --------------------------------- |
| A. Neon           | serverless Postgres, pooling, 무료 | 무료 한도, 콜드 지연                | **채택**                          |
| B. Supabase       | Postgres + 부가기능(Auth 등) 무료  | 이 프로젝트엔 부가기능 불필요       | 단순 DB만 필요 → Neon이 더 가벼움 |
| C. AWS RDS        | 실무 표준                          | 상시 인스턴스 비용, 서버리스 궁합 ↓ | 프리티어 정책 변경 + 운영 부담    |
| D. PlanetScale 등 | 스케일                             | MySQL 계열, Postgres 일관성 깨짐    | Postgres 일관 선호                |

## 결과 / 영향

- `DATABASE_URL`은 Neon **pooled** 연결 문자열을 사용 (`.env.example`에 명시).
- Prisma 7 + `@prisma/adapter-neon`(`@neondatabase/serverless`)로 런타임 어댑터 연결 ([ADR-0005](./0005-orm-prisma.md)).
- 싱글톤 클라이언트(`src/lib/prisma.ts`)로 dev HMR 시 커넥션 누수 방지.

## 재검토 트리거

- 무료 한도 초과, 또는 콜드 지연이 읽기 경험을 해칠 때.

## 참고

- Neon serverless driver, Prisma serverless connection management
