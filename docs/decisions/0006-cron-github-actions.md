# ADR-0006: 수집 스케줄링 — GitHub Actions cron

> **상태**: Accepted
> **날짜**: 2026-06-03
> **결정자**: @sikkzz (with Claude)
> **관련 문서**: [PROJECT_ROOT](../PROJECT_ROOT.md), [ADR-0002](./0002-nextjs-fullstack.md), [ADR-0003](./0003-hosting-vercel.md)

---

## 맥락 (Context)

RSS 피드를 주기적으로 폴링해 새 글을 수집해야 한다. Vercel Hobby의 내장 cron은 빈도 제약(일 단위 등)이 있어 자유로운 주기 설정이 어렵다.

## 결정 (Decision)

**선택**: **GitHub Actions의 scheduled workflow(cron)** 가 배포된 앱의 **`/api/cron/poll`** 라우트를 주기적으로 호출한다.

- 라우트는 시크릿 토큰으로 호출을 인증한다(무단 호출 차단).
- 폴링 주기는 Actions의 `schedule` cron으로 자유롭게 조정.

## 이유 / 트레이드오프

- **얻는 것**: 무료, 주기 자유, 워크플로 로그로 실행 이력 추적. 수집 로직 자체는 앱 안(API Route)에 두어 [ADR-0002](./0002-nextjs-fullstack.md)의 단일 앱 원칙 유지.
- **포기하는 것**: GitHub Actions cron은 부하 상황에서 실행이 수 분 지연될 수 있고 정확한 정시 실행을 보장하지 않는다. (수집은 지연에 관대하므로 허용)

## 검토한 대안

| 대안                   | 장점                  | 단점                     | 제외 이유                   |
| ---------------------- | --------------------- | ------------------------ | --------------------------- |
| A. GitHub Actions cron | 무료, 주기 자유, 로그 | 정시성 보장 X, 지연 가능 | **채택** (수집은 지연 관대) |
| B. Vercel Cron         | 앱과 동일 플랫폼      | Hobby 빈도 제약          | 빈도 부족                   |
| C. 외부 cron 서비스    | 정시성                | 추가 서비스/계정         | 무료·단순 우선              |

## 결과 / 영향

- `/api/cron/poll` Route Handler를 구현하고, 토큰 검증 후 수집 파이프라인을 실행한다.
- `.github/workflows/`에 `schedule` cron workflow를 추가하고, 호출용 시크릿(앱 URL + 토큰)을 등록한다.

## 재검토 트리거

- 정시 수집이 중요해지거나 Actions cron 지연이 사용 경험을 해칠 때.

## 참고

- GitHub Actions `schedule` (cron), Vercel Cron Jobs limits
