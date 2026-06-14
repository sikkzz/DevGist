# Feature: 글 검색

> **상태**: 구현됨
> **작성일**: 2026-06-14
> **관련 문서**: [리더 UI Spec](./feature-reader-ui.md), [보관함 Spec](./feature-library.md)

---

## 1. 배경 / 문제

수집한 글이 쌓이는데 **다시 찾을 방법이 없었다.** "그때 본 그 글"을 키워드로 되짚는 검색이 학습 아카이브의 핵심 동선.

## 2. 결정

별도 검색 탭/페이지를 두지 않고, **홈 피드 상단의 검색 바**로 통합. 검색어는 **주제칩·정렬과 함께 AND로 결합되는 또 하나의 필터**다.

- **통합 필터**: `topics[]` + `sort` + `query` 세 가지가 모두 독립적이고 AND로 결합. "칩 선택 후 검색", "검색 후 칩/정렬 변경", "정렬 중 검색" 등 **모든 조합·순서가 자연스럽게 동작**한다(하나의 필터 상태이므로).
- **쿼리** (`getArticles(skip, topics, sort, query)`): **Postgres FTS**로 제목(가중 A)·정제 본문(가중 B)을 검색, `ts_rank` 관련도 정렬. 주제 필터와 `AND`. 상세 결정은 [ADR-0011](../decisions/0011-fulltext-search.md).
  - prefix tsquery(`tok:*`)로 한국어 조사·영어 prefix·다중단어 AND 처리. 함수형 GIN 인덱스.
  - 초기 `ILIKE` 부분일치는 요약 오염(CSS 폰트명 등)·랭킹 부재로 노이즈가 컸다(예: `mono` 17건 중 16건 노이즈) → FTS로 승급.
- **UI**: 홈 상단 검색 입력 → 디바운스(300ms) → query 확정 시 최상단으로. 캐시 키가 `(topics,sort,query)`라 이미 본 조합은 재요청 없이 즉시 표시. 무한 스크롤·`?q=` URL 동기화는 기존과 동일.

## 3. 트레이드오프

- **별도 라우트/탭 아님** — 검색은 "가끔 되찾기" 동선이라 상시 탭은 과함. 홈 한 화면에서 칩·정렬과 함께 거르는 편이 마찰이 적음.
- **본문(content) 전체 검색 제외** — 본문은 큰 HTML이라 ILIKE가 무겁고 태그까지 매칭됨. 제목+요약이 "되찾기"엔 대체로 충분. 필요 시 `pg_trgm` GIN 인덱스나 tsvector(FTS)로 확장.
- **관련도 정렬 없음** — ILIKE는 랭킹이 없어 기존 정렬(추천/최신)을 그대로 사용.

## 4. 구현 파일

- `src/lib/articles.ts` — `getArticles`에 `query` 파라미터 추가(주제 필터와 AND)
- `src/app/articles-actions.ts` — `loadMoreArticles`에 `query` 전달
- `src/app/article-feed.tsx` — 상단 검색 입력 + `(topics,sort,query)` 캐시/조회/URL 통합
- `src/app/page.tsx` — `?q=` 파싱 → 초기 묶음·`initialQuery` 전달

## 5. 비범위 (Out of Scope)

- 본문 전체 검색 / 형태소 분석 기반 FTS / 관련도 랭킹
- 검색어 하이라이트, 최근 검색어 저장
