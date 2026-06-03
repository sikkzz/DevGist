# ADR-0003: 호스팅 — Vercel (Hobby)

> **상태**: Accepted
> **날짜**: 2026-06-03
> **결정자**: @sikkzz (with Claude)
> **관련 문서**: [PROJECT_ROOT](../PROJECT_ROOT.md), [ADR-0002](./0002-nextjs-fullstack.md)

---

## 맥락 (Context)

[ADR-0002](./0002-nextjs-fullstack.md)로 Next.js 풀스택 단일 앱을 채택했다. 어디에 배포할지 정해야 한다. 개인용·무료를 우선한다.

## 결정 (Decision)

**선택**: **Vercel Hobby(무료)** 에 배포한다.

## 이유 / 트레이드오프

- **얻는 것**: Next.js 1st-party 플랫폼 → 빌드/배포 무설정에 가깝다. 무료 티어로 개인 스케일 충분. preview 배포, 환경변수 관리 기본 제공.
- **포기하는 것**: Hobby는 cron 빈도 제약, 함수 실행 시간 한도가 있다. cron은 GitHub Actions로 우회([ADR-0006](./0006-cron-github-actions.md)).
- EC2/PaaS(Fly 등)에 직접 올리는 방향도 검토했으나, Next 풀스택을 굳이 다른 서버에 올릴 실익이 없고 실무에서도 잘 안 쓰는 조합이라 제외.

## 검토한 대안

| 대안           | 장점                         | 단점                                | 제외 이유                            |
| -------------- | ---------------------------- | ----------------------------------- | ------------------------------------ |
| A. Vercel      | Next 1st-party, 무료, 무설정 | cron/실행시간 한도                  | **채택** (한도는 외부 cron으로 우회) |
| B. Fly.io      | 컨테이너 자유도              | Next 풀스택엔 과함, Dockerfile 운영 | 실익 적음                            |
| C. AWS(EC2 등) | 실무 인프라 경험             | 1인 개인 도구엔 운영 부담 과다      | 스코프 대비 과함                     |

## 결과 / 영향

- 빌드 시 DB 접속을 피하기 위해 CI build step에 더미 `DATABASE_URL`을 둔다 (Prisma client generate만 필요).
- cron은 외부에서 라우트 호출 형태로 구현.

## 재검토 트리거

- 무료 한도(대역폭/함수 실행)를 자주 초과하거나, 워커 분리가 필요해질 때.

## 참고

- Vercel Hobby plan limits
