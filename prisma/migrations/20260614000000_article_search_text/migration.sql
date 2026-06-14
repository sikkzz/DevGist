-- ADR-0011: 글 검색을 Postgres FTS로.
-- 검색 색인용 평문 본문 컬럼 + 제목(A)·본문(B) 가중 tsvector 함수형 GIN 인덱스.

-- 1) 정제된 본문 평문 (HTML/CSS 제거). 적재 시 채우고, 기존 글은 백필 스크립트로 채운다.
ALTER TABLE "articles" ADD COLUMN "searchText" TEXT;

-- 2) 함수형 GIN 인덱스 — to_tsvector('simple', …) 2-인자형은 IMMUTABLE이라 표현식 인덱스 가능.
--    쿼리의 WHERE/ORDER BY가 동일 표현식을 써야 이 인덱스를 사용한다(getArticles 참고).
CREATE INDEX "articles_fts_idx" ON "articles" USING GIN (
  (
    setweight(to_tsvector('simple', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce("searchText", '')), 'B')
  )
);
