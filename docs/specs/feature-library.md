# Feature: 보관함 (북마크 / 읽은 글 모아보기)

> **상태**: 구현됨
> **작성일**: 2026-06-13
> **관련 문서**: [리더 UI Spec](./feature-reader-ui.md), [읽음 상태 Spec](./feature-read-state.md)

---

## 1. 배경 / 문제

북마크·읽음 상태는 글 상세에서 토글할 수 있지만, **모아서 다시 보는 화면이 없었다.** "학습 아카이브"(읽은 글을 정리해 다시 찾기) 목표의 절반이 비어 있던 셈.

## 2. 결정

홈 피드와 분리된 **`/library` 라우트**에 **북마크 / 읽은 글** 두 뷰를 세그먼트 토글로 제공.

- **데이터**: 스키마 변경 없음. `Read.bookmarked` / `Read.isRead` / `Read.readAt` / `Read.updatedAt` 재사용.
- **쿼리** (`getSavedArticles(view, skip)`):
  - 북마크: `where read.is.bookmarked` / 정렬 `read.updatedAt desc`(최근 활동순)
  - 읽은 글: `where read.is.isRead` / 정렬 `read.readAt desc`(읽은 시각 최신순)
  - 카드 `select`/매핑은 홈 목록(`getArticles`)과 **공용 추출**(`CARD_SELECT`/`toCard`)로 중복 제거.
- **UI**: 카드는 기존 `ArticleItem` 재사용. 홈과 같은 뷰별 클라이언트 캐시 + IntersectionObserver 무한 스크롤. 빈 상태 문구 포함.
- **헤더**: 로그인 시 "보관함" 링크 노출.

## 3. 트레이드오프

- `ArticleFeed`(홈)를 일반화해 재사용하지 않고 **별도 `LibraryFeed`**로 둠 — 홈은 주제칩+정렬에 강결합돼 조건 분기가 늘기 때문. 약간의 패턴 중복을 감수하고 "파일 하나로 이해 가능"을 우선.
- '읽은 글' 뷰는 전부 읽음 상태라 `ArticleItem`의 dim(흐림)을 끔(`dim={false}`) — 목록 전체가 흐려지는 것 방지.
- 북마크 정렬에 별도 `bookmarkedAt`를 두지 않고 `Read.updatedAt`을 사용 — 읽음 토글에도 갱신되지만 "최근 활동순"으로 충분하다고 판단(스키마 변경 회피).

## 4. 구현 파일

- `src/lib/article-types.ts` — `LibraryView` 타입/뷰 목록
- `src/lib/articles.ts` — `CARD_SELECT`/`toCard` 추출, `getSavedArticles`
- `src/app/library/page.tsx` — 서버(인증 + 첫 묶음)
- `src/app/library/library-view.tsx` — 클라(`LibraryFeed`: 토글·캐시·무한스크롤)
- `src/app/library/library-actions.ts` — `loadMoreSaved`
- `src/app/library/loading.tsx` — 스켈레톤
- `src/app/article-item.tsx` — `dim` prop 추가
- `src/app/layout.tsx` — 헤더 "보관함" 링크

## 5. 비범위 (Out of Scope)

- 북마크 정렬을 "북마크한 순"으로(전용 `bookmarkedAt` 필드) — 필요 시 별도 마이그레이션.
- 보관함 내 주제/검색 필터 — 추후.
