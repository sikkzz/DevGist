# ADR-0011: 글 검색 — Postgres Full-Text Search (제목·본문 가중 + 랭킹)

> **상태**: Accepted
> **날짜**: 2026-06-14
> **결정자**: @sikkzz (with Claude)
> **관련 문서**: [검색 Spec](../specs/feature-search.md), [ADR-0001](./0001-rss-aggregator-direction.md)

---

## 맥락 (Context)

초기 검색은 제목·요약 `ILIKE '%q%'` 부분일치였다. 실데이터 진단에서 두 문제 확인:

1. **요약 오염**: 요약에 CSS 폰트명(`'JetBrains Mono'`·`monospace` 등) 등 추출 찌꺼기가 섞여, `mono` 검색 17건 중 16건이 요약 노이즈, 정답 1건만 제목 매칭.
2. **substring 한계**: 단어 중간 매칭(`monospace`), 랭킹 없음, 어순/띄어쓰기 민감, 인덱스 없어 풀스캔.

제목만 검색하면 노이즈는 줄지만 **본문으로 못 찾는다**(되찾기 동선 손실). 도메인 표준(리더/아티클 검색)은 **제목+본문을 토큰화해 가중 랭킹**으로 검색하는 것.

## 결정 (Decision)

**Postgres Full-Text Search**로 승급. 외부 검색엔진 없이 DB만으로.

- **색인 대상**: 제목(가중 A) + **정제 본문**(가중 B). 본문은 HTML/CSS/스크립트를 제거한 평문(`searchText`)으로 저장 — 오염(CSS 폰트명) 제거가 핵심.
- **tsvector(함수형 GIN 인덱스)**: 별도 stored 컬럼 없이, `searchText` 컬럼 + 표현식 기반 함수형 GIN 인덱스.
  ```sql
  GIN ( setweight(to_tsvector('simple', title), 'A')
        || setweight(to_tsvector('simple', searchText), 'B') )
  ```
  (`to_tsvector('simple', …)` 2-인자형은 IMMUTABLE → 함수형 인덱스 가능.)
- **쿼리**: 입력을 토큰화→`tok:* & tok:*` **prefix tsquery**.
  - prefix `:*`가 **한국어 조사**(`리액트` → `리액트의`)와 영어 prefix(`mono` → `monorepo`)를 모두 해결(spike 검증).
  - 다중 단어는 `&`(AND)로 결합 → 어순/띄어쓰기 완화.
- **정렬**: `ts_rank`(가중 반영) 내림차순 → 제목 매칭이 상위. 검색 중에도 주제칩(`topics &&`)·정렬은 보조로 결합.
- **'simple' 설정**: 언어별 어간(stemming) 없음. 한국어 형태소 분석은 Postgres 기본 미지원 → `simple`(공백/문장부호 토큰화) + prefix로 실용 타협. 더 정밀한 한국어는 `pg_bigm` 등 추후.

## 이유 / 트레이드오프

- **얻는 것**: 토큰화로 단어중간 노이즈 제거, 가중 랭킹(의도한 결과 먼저), 본문 검색 recall, GIN 인덱스로 빠름. 외부 인프라 0(Neon만).
- **포기/비용**: 마이그레이션(컬럼+인덱스) + 본문 평문화 파이프라인 + 기존 글 백필. 한국어 어간 변형은 못 묶음.

## 결과 / 영향

- 스키마: `Article.searchText String?` + 함수형 GIN 인덱스(raw SQL 마이그레이션).
- 파이프라인: 적재 시 `searchText = htmlToSearchText(content)`.
- 백필: 기존 글 `searchText` 채우는 일회성 스크립트.
- 쿼리: `getArticles`의 query 분기를 `$queryRaw` FTS 경로로(랭킹·prefix·주제필터·페이지네이션).

## 재검토 트리거

- 한국어 형태소 정밀도가 부족하면 → `pg_bigm`/`mecab` 또는 외부 엔진(Meilisearch) 검토.
