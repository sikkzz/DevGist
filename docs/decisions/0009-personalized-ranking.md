# ADR-0009: 개인화 추천 — 규칙 기반 스코어링 (프로필 비공개)

> **상태**: Accepted
> **날짜**: 2026-06-07
> **결정자**: @sikkzz (with Claude)
> **관련 문서**: [ADR-0008](./0008-topic-classification.md), [리더 UI Spec](../specs/feature-reader-ui.md)

---

## 맥락 (Context)

리더의 원래 목적은 "시장 흐름 + 실무 적용 기술 + **내가 해볼 것**"을 보는 것. "해볼 것/추천 방향성"은 본질적으로 **개인화**라, 사용자의 회사 스택·학습 우선순위를 모르면 일반론이 된다. 무료로, 본문은 무손실 유지하면서 글을 **나와의 관련도**로 점수·태그·정렬해야 한다.

## 결정 (Decision)

**규칙 기반 개인화 스코어링** ([ADR-0008] 주제 분류의 확장).

- **프로필** = 가중 키워드 셋: `companyStack`(회사 스택, W=3) / `learning`(학습 우선순위 영역별 키워드+가중) / `diversify`(회사 대안 스택, W=2).
- 글의 (제목+요약)을 프로필에 매칭 → `personalScore = Σ(히트 × 가중)`, 켜진 신호별 `personalTags`(회사·학습·다양화·해볼것).
- **계산 시점**: 수집(ingest) 시 + 프로필 변경 시 재계산(`/api/admin/reclassify`). `Article.personalScore`/`personalTags`에 저장.
- 리더: **추천순 정렬** 토글 + 카드에 개인화 칩.

## 프로필 보관 (회사 정보 비공개)

- 프로필 데이터는 **DB(`Profile` 단일 행, Json)** 에 저장 → 런타임(Vercel·로컬) 어디서나 읽음.
- 편집은 **gitignore된 `config/profile.local.json`** → `scripts/seed-profile.mjs`로 DB upsert.
- 레포엔 **일반 코드 + `profile.example.json`(placeholder)만** 커밋. 회사 스택 키워드·도메인은 레포에 안 들어감.

## 이유 / 트레이드오프

- **얻는 것**: 무료·결정적·기존 키워드 엔진 재사용. "시장 전체" → "내가 볼/해볼 것"으로 좁힘.
- **포기하는 것**: LLM 대비 "왜 너에게 유용한지" 서술은 없음(점수·태그까지). 키워드 사전·프로필 유지보수.

## 결과 / 영향

- 스키마: `Article.personalScore Int`, `Article.personalTags String[]`, `Profile` 모델 (+ 마이그레이션).
- `src/lib/feeds/personalize.ts`(스코어링) + `keyword-match.ts`(공용 매처, classify와 공유).
- 본문 무손실 유지 — 점수/태그는 메타데이터 ([ADR-0008] 연장).

## 재검토 트리거

- 점수 신뢰가 낮으면 → 가중치·키워드 조정, 또는 LLM 개인화(서술형 추천)로 승급.
