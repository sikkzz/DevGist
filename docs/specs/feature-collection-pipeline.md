# 수집 파이프라인 Spec

> **상태**: In Progress
> **작성일**: 2026-06-03
> **작성**: Claude (프롬프팅: @sikkzz)
> **관련 문서**: [ADR-0001](../decisions/0001-rss-aggregator-direction.md), [ADR-0005](../decisions/0005-orm-prisma.md), [ADR-0006](../decisions/0006-cron-github-actions.md)

---

## 1. 한 줄 요약

등록된 RSS/Atom 피드를 주기적으로 폴링해 새 글의 **본문 전문**을 무손실로 수집·적재하는 백엔드 파이프라인.

## 2. 배경 / 왜 만드는가

- DevGist의 1순위 가치는 "출퇴근길 휴대폰으로 전문 그대로 읽기"다. 그 전제는 **본문 전문이 DB에 들어와 있는 것**.
- 크롤링이 아닌 RSS 정식 수집([ADR-0001](../decisions/0001-rss-aggregator-direction.md))으로 약관/저작권 리스크를 피한다.
- 이 파이프라인이 없으면 읽을 데이터 자체가 없다. Phase 1의 핵심.

## 3. 사용자 스토리

- **As a** 개인 사용자, **I want** 등록한 블로그의 새 글이 자동으로 모이길, **so that** 따로 찾아다니지 않고 한 곳에서 전문을 읽는다.
- **As a** 개인 사용자, **I want** 피드가 요약만 줘도 가능하면 전문이 채워지길, **so that** 앱을 떠나 원문으로 가지 않는다.

## 4. 수용 기준 (Acceptance Criteria)

- [ ] `/api/cron/poll`이 `CRON_SECRET` 토큰 없이는 401을 반환한다.
- [ ] 토큰이 맞으면 `active=true`인 모든 `Feed`를 폴링한다.
- [ ] RSS2/Atom 피드를 파싱하고 `content:encoded`가 있으면 그 **원문 HTML을 그대로** 저장한다 (요약/압축 금지).
- [ ] 피드 본문이 부실하면 원문 링크에서 `@mozilla/readability`로 **본문만 추출**해 저장하고 `contentExtracted=true`로 표시한다.
- [ ] 추출이 부실/실패하면 본문을 비우고(또는 부분 저장) 원문 링크로 fallback — 사용자는 최소한 `link`로 갈 수 있다.
- [ ] 같은 글(`@@unique([feedId, guid])`)은 중복 적재되지 않는다 (재폴링해도 INSERT 0).
- [ ] 한 피드가 실패해도 다른 피드 수집은 계속된다 (개별 격리).
- [ ] 폴링 후 `Feed.lastFetchedAt`가 갱신된다.
- [ ] 응답으로 피드별 처리 요약(신규/스킵/실패 건수)을 JSON으로 돌려준다.

## 5. 비범위 (Out of Scope)

- 피드 등록/관리 UI — 이번엔 seed 스크립트/직접 INSERT로 피드를 넣는다.
- 읽기 화면(리더 UI), 인증 게이트/`noindex` — 이후 Phase.
- 본문 요약/AI 가공 — **영구 비범위** (1순위 제약 위반).
- 이미지 리호스팅/프록시 — 이후 검토.
- GitHub Actions cron 워크플로 등록 자체는 코드만 두고, 실제 secret 등록/배포는 배포 단계에서.

## 6. 파이프라인 플로우

```mermaid
flowchart TD
    Cron[GitHub Actions cron] -->|Bearer CRON_SECRET| Route[/api/cron/poll]
    Route -->|인증 실패| R401[401]
    Route --> Loop{active Feed 순회}
    Loop --> Fetch[RSS fetch + parse]
    Fetch --> Item{각 item}
    Item --> HasFull{content:encoded\n전문 충분?}
    HasFull -->|예| UseRaw[원문 HTML 그대로]
    HasFull -->|아니오| Extract[원문 link → readability 추출]
    Extract --> Good{추출 충분?}
    Good -->|예| UseExtracted[추출 본문 + contentExtracted=true]
    Good -->|아니오| Fallback[본문 비움, link로 fallback]
    UseRaw --> Upsert[(feedId,guid) 중복 체크 후 적재]
    UseExtracted --> Upsert
    Fallback --> Upsert
    Upsert --> Loop
    Loop --> Done[피드별 요약 JSON]
```

## 7. 모듈 설계

| 파일                             | 책임                                                                                                                                                                   |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/feeds/parse.ts`         | `rss-parser`로 피드 fetch+파싱 → 정규화된 `ParsedItem[]` (guid/title/link/author/publishedAt/contentEncoded/summary)                                                   |
| `src/lib/feeds/extract.ts`       | `content:encoded` 충분성 판정 + 부족 시 `@mozilla/readability`(linkedom) 추출 + fallback 판정 → `{ content, contentExtracted }`. `<base>` 주입으로 상대경로 URL 절대화 |
| `src/lib/feeds/ingest.ts`        | 한 피드의 item들을 `(feedId,guid)` 기준 `createMany(skipDuplicates)`로 적재, `lastFetchedAt` 갱신                                                                      |
| `src/lib/feeds/poll.ts`          | active 피드 순회·격리 오케스트레이션 → 피드별 요약                                                                                                                     |
| `src/app/api/cron/poll/route.ts` | Bearer 토큰 인증 → `poll()` 호출 → 요약 응답. `runtime='nodejs'`, `dynamic='force-dynamic'`                                                                            |
| `scripts/seed-feeds.mjs`         | (임시) 초기 피드 목록 upsert                                                                                                                                           |

## 8. 핵심 휴리스틱 (튜닝 대상)

- **전문 충분 판정**: `content:encoded`(or `content`)의 텍스트 길이 ≥ `MIN_FULL_LEN`(초기 600자) → 원문으로 간주, `contentExtracted=false`.
- **추출 충분 판정**: readability 결과 `textContent` 길이 ≥ `MIN_EXTRACT_LEN`(초기 400자) → 채택, `contentExtracted=true`.
- 둘 다 미달 → `content=null`, `contentExtracted=false`, 사용자는 `link`로 원문 이동(fallback).
- **폴링당 피드별 최신 N개만**(`MAX_ITEMS_PER_POLL=30`) 처리 — 전체 아카이브 백필 방지로 함수 실행시간 유계. 피드는 최신순 + dedup이라 새 글 누락 없음.
- **추출 동시성 `EXTRACT_CONCURRENCY=5`** — fetch+jsdom을 5병렬로 묶어 콜드 백필 시간 단축.
- 임계값/상수는 `constants.ts`에 모아두고 실제 피드 보고 조정.

## 9. 테스트 시나리오

| #   | 시나리오                  | 예상 결과                         | 자동화       |
| --- | ------------------------- | --------------------------------- | ------------ |
| 1   | 토큰 없이 호출            | 401                               | 수동/통합    |
| 2   | content:encoded 전문 피드 | 원문 그대로 저장, extracted=false | 통합(실피드) |
| 3   | 요약만 주는 피드          | readability 추출, extracted=true  | 통합         |
| 4   | 재폴링                    | 신규 0, 중복 skip                 | 통합         |
| 5   | 죽은 피드 URL 1개         | 해당 피드만 실패, 나머지 진행     | 통합         |

## 10. 미정 사안 (Open Questions)

- 임계값(600/400) 실제 피드 보고 재조정 필요.
- ~~readability + jsdom 번들~~ → **linkedom으로 교체 완료**. jsdom 29가 끌어오는 `html-encoding-sniffer@6 → @exodus/bytes`(ESM 전용)를 Vercel 서버리스 CJS 컨텍스트에서 `require()`하다 `ERR_REQUIRE_ESM`로 500. linkedom은 가볍고 ESM/CJS 친화적이라 해결 + 콜드스타트 개선.
- 폴링 주기(cron) — 배포 단계에서 결정.
- **거대 인라인 자산**: 일부 글이 본문 끝에 base64 인라인 이미지/폰트(수 MB)를 품어 단일 `content`가 4.7MB까지 커짐. ADR-0001(무손실) 때문에 임의 제거는 보류. Neon 무료 0.5GB 한도 압박 시 → 거대 `data:` URI만 원격 URL/프록시로 치환하는 정책 검토 (요약 아님, 무손실 유지).
- 클라이언트 disconnect 시 Next dev는 핸들러를 중단하지 않음(끝까지 실행). 운영(Vercel)은 `maxDuration`(60s)에서 강제 종료되지만, 파이프라인이 멱등이라 다음 폴링이 이어받음.

## 11. 검증 결과 (2026-06-03 로컬)

- 401: 토큰 없음/오류 → 거부 ✅
- 1차 폴링: 80건 적재(Vercel 30 / Cloudflare 20 / overreacted 30), 실패 0, **~27초**(cap 적용 전 3분 → 단축) ✅
- 2차 폴링: created 0 / skipped 80, ~5초 → **멱등** ✅
- 본문 무손실: `content` null 0건. Cloudflare는 content:encoded 원문(5K~33K자), overreacted는 전량 readability 추출(피드가 본문 미제공), Vercel은 혼합 ✅

## 12. 변경 이력

| 날짜       | 변경 내용                                        |
| ---------- | ------------------------------------------------ |
| 2026-06-03 | 최초 작성 + 로컬 검증, item cap·동시성 튜닝 반영 |

</content>
