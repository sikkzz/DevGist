# 읽음·북마크 Spec

> **상태**: In Progress
> **작성일**: 2026-06-03
> **작성**: Claude (프롬프팅: @sikkzz)
> **관련 문서**: [리더 UI Spec](./feature-reader-ui.md)

---

## 1. 한 줄 요약

글의 **읽음 상태**와 **북마크**를 기록·표시한다. `Read` 모델을 처음으로 활용.

## 2. 배경 / 왜 만드는가

- 매일 쌓이는 글에서 **이미 읽은 것**을 구분해야 다시 안 읽는다 (출퇴근 반복 사용).
- 나중에 다시 볼 글을 **북마크**로 저장.
- 스키마에 `Read`(isRead/bookmarked/readAt)가 이미 있으나 미사용 → 이번에 연결.

## 3. 사용자 스토리

- **As a** 개인 사용자, **I want** 글을 열면 자동으로 읽음 처리되길, **so that** 목록에서 안 읽은 글만 도드라진다.
- **As a** 개인 사용자, **I want** 글을 북마크 토글하길, **so that** 중요한 글을 따로 모은다.

## 4. 수용 기준 (Acceptance Criteria)

- [ ] 상세 페이지를 열면 해당 글이 **읽음(isRead=true, readAt)** 으로 기록된다 (마운트 시 자동).
- [ ] 목록에서 읽은 글은 **시각적으로 흐리게**(dimmed) 표시된다.
- [ ] 상세의 **북마크 버튼**으로 on/off 토글된다. 클릭 즉시 UI 반영(낙관적), 서버 반영.
- [ ] 목록에서 북마크된 글은 **★** 표시된다.
- [ ] 변경 후 목록으로 돌아가면 상태가 반영돼 있다 (`revalidatePath`).
- [ ] 재진입/새로고침해도 상태가 유지된다 (DB 영속).

## 5. 비범위 (Out of Scope)

- "안 읽음만/북마크만" 필터 탭 — 다음 슬라이스 (상태가 보이면 자연스러운 다음 단계).
- 읽음 수동 해제 토글 — 이번엔 자동 읽음만. 필요 시 추가.
- 인증 — 아직 없음. Server Action은 현재 단일 사용자/개인 전제로 무인증. **공개 배포 시 반드시 인증 게이트 추가**(제약 3).

## 6. 설계

| 파일                                       | 책임                                                                                      |
| ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `src/lib/read-state.ts`                    | `'use server'` — `markArticleRead(id)` / `toggleBookmark(id)`. upsert + `revalidatePath`. |
| `src/app/article/[id]/mark-read.tsx`       | `'use client'` — 마운트 시 `markArticleRead` 호출(렌더 없음).                             |
| `src/app/article/[id]/bookmark-button.tsx` | `'use client'` — 낙관적 토글 버튼.                                                        |
| `src/lib/articles.ts`                      | 목록/상세 쿼리에 `read { isRead, bookmarked }` 포함.                                      |

- `Read.articleId`가 `@unique` → upsert 기준 키.
- 페이지가 `force-dynamic`이라 재방문 시 항상 최신. `revalidatePath`는 클라이언트 라우터 캐시 갱신용.

## 7. 테스트 시나리오

| #   | 시나리오    | 예상 결과                       | 자동화 |
| --- | ----------- | ------------------------------- | ------ |
| 1   | 상세 진입   | Read row 생성/갱신, isRead=true | 통합   |
| 2   | 목록 복귀   | 해당 글 dimmed                  | 수동   |
| 3   | 북마크 토글 | UI 즉시 ★, DB bookmarked=true   | 통합   |
| 4   | 재토글      | bookmarked=false                | 통합   |
| 5   | 새로고침    | 상태 유지                       | 수동   |

## 8. 변경 이력

| 날짜       | 변경 내용 |
| ---------- | --------- |
| 2026-06-03 | 최초 작성 |
