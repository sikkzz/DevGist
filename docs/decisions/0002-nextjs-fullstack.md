# ADR-0002: Next.js 풀스택 단일 앱 (별도 백엔드 없음)

> **상태**: Accepted
> **날짜**: 2026-06-03
> **결정자**: @sikkzz (with Claude)
> **관련 문서**: [ADR-0003](./0003-hosting-vercel.md)

---

## 맥락 (Context)

1인 개발이고 스코프가 작은 개인용 리더다. RSS 수집(서버 작업) + 리더 UI(클라이언트) 둘 다 필요하지만, 프론트/백엔드를 분리해 별도 서버를 운영할 만큼 규모가 크지 않다.

## 결정 (Decision)

**선택**: 프론트·백엔드 분리 없이 **Next.js App Router 단일 앱**으로 풀스택을 구성한다.

- 데이터 조회/렌더링은 Server Component.
- 수집·mutation은 API Route(`/api/...`) 또는 Server Action.
- DB 접근은 Prisma 싱글톤(`src/lib/prisma.ts`)을 서버에서만 호출.

## 이유 / 트레이드오프

- **얻는 것**: 인프라 단순화(서버 1개), 배포 단순화(Vercel 자연 적합), 타입을 프론트/백 사이에 공유.
- **포기하는 것**: 백엔드를 독립 서비스로 분리·확장하는 경험은 이 프로젝트에선 못 얻음. (필요해지면 그때 분리)

## 검토한 대안

| 대안                         | 장점                       | 단점                  | 제외 이유             |
| ---------------------------- | -------------------------- | --------------------- | --------------------- |
| A. Next 풀스택 단일 앱       | 단순, 배포 쉬움, 타입 공유 | 백엔드 분리 경험 없음 | **채택**              |
| B. Next + 별도 NestJS 백엔드 | 관심사 분리, 확장성        | 서버 2개 운영, 과설계 | 개인 스케일 대비 과함 |

## 결과 / 영향

- 모든 서버 로직은 Next 앱 내부(API Route / Server Component / Server Action)에 둔다.
- Vercel 배포가 자연스러워짐 ([ADR-0003](./0003-hosting-vercel.md)).
- cron은 외부(GitHub Actions)에서 `/api/cron/poll`을 호출하는 형태 ([ADR-0006](./0006-cron-github-actions.md)).

## 재검토 트리거

- 수집 작업이 무거워져 Vercel 함수 실행 한도/타임아웃에 자주 걸릴 때 → 워커 분리 검토.

## 참고

- Next.js App Router (Server Components / Server Actions / Route Handlers)
