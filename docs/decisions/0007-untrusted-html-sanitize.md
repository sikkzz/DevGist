# ADR-0007: 신뢰 불가 본문 HTML — 렌더 시점 sanitize (sanitize-html)

> **상태**: Accepted
> **날짜**: 2026-06-03
> **결정자**: @sikkzz (with Claude)
> **관련 문서**: [ADR-0001](./0001-rss-aggregator-direction.md), [리더 UI Spec](../specs/feature-reader-ui.md)

---

## 맥락 (Context)

리더는 외부 블로그의 **본문 HTML을 그대로 화면에 렌더**한다(`dangerouslySetInnerHTML`). 출처가 제3자라 `<script>`, 인라인 이벤트 핸들러(`onerror=`), `javascript:` URL, 악성 `iframe` 등이 섞일 수 있다 → **저장형 XSS** 위험. 동시에 프로젝트 1순위 제약([ADR-0001](./0001-rss-aggregator-direction.md))은 **본문 전문 무손실**이라, 코드블록·이미지·링크 같은 정상 콘텐츠를 깎으면 안 된다.

## 결정 (Decision)

1. **원문(raw HTML)은 DB(`Article.content`)에 그대로 보존**한다. 절대 저장 단계에서 깎지 않는다(무손실 유지).
2. **렌더 시점에만** `sanitize-html`로 정화한 **사본**을 만들어 출력한다. (`src/lib/sanitize.ts`)
3. allowlist 정책:
   - **허용**: 본문 구조 태그(`p h1~h6 ul ol li blockquote pre code img a figure figcaption table thead tbody tr th td hr br strong em ...`), 코드/이미지/링크 보존.
   - **제거**: `script style`, 모든 `on*` 이벤트 핸들러, `javascript:` 스킴, form 계열.
   - **`iframe`**: 신뢰 호스트(youtube, youtube-nocookie, vimeo, codesandbox, codepen)만 허용 — 임베드 손실과 보안의 절충.
   - **인라인 SVG**: 구조/표현 태그(`svg g path image symbol use defs linearGradient ...`)와 표현 속성을 허용해 다이어그램(Excalidraw 등)을 보존한다. 단 `<script>`, `<foreignObject>`(HTML 밀반입), `animate*`/`set`(애니메이션 기반 우회)은 **제외**. `xlink:href`도 스킴 검사 대상에 포함(`javascript:` 차단), `data:`는 `img`/`image`에만 허용. SVG는 camelCase 태그/속성이라 파서 소문자화를 끈다.
   - `a`는 `target="_blank"` + `rel="noopener noreferrer nofollow"` 강제, 외부 이동임을 명시.

## 이유 / 트레이드오프

- **얻는 것**: 저장형 XSS 차단. 원문은 무손실로 남아 정책을 나중에 바꿔도(임계값/허용목록 조정) 재정화만으로 반영 가능. 서버(RSC)에서 정화하므로 클라이언트로 원본·로직이 안 나감.
- **포기하는 것**: 정화는 매 렌더 비용(특히 수 MB 본문). MVP는 매 요청 정화로 두고, 느려지면 정화 결과 캐시(`use cache`/별도 컬럼) 도입. 허용목록 밖 임베드(예: 트위터 위젯)는 손실될 수 있음.

## 검토한 대안

| 대안                       | 장점                                 | 단점                                                 | 제외 이유                           |
| -------------------------- | ------------------------------------ | ---------------------------------------------------- | ----------------------------------- |
| A. sanitize-html (렌더 시) | Node 전용, allowlist 세밀, 원문 보존 | 렌더 비용                                            | **채택**                            |
| B. DOMPurify + jsdom       | 브라우저 표준                        | 서버에서 jsdom 필요·설정 번잡                        | sanitize-html이 Node 서버에 더 적합 |
| C. 저장 단계에서 정화      | 렌더 빠름                            | **무손실 위반**(원문 소실), 정책 변경 시 재수집 필요 | ADR-0001과 충돌                     |
| D. 정화 안 함              | 간단                                 | 저장형 XSS                                           | 보안상 불가                         |

## 결과 / 영향

- `src/lib/sanitize.ts` 신설, 리더 상세에서 본문 출력 전 통과.
- `Article.content`는 raw 유지(스키마 변경 없음).
- 개인 이용 기본(제약 3)이라 노출면이 작지만, 공개 전환 시에도 이 정화는 그대로 유효.

## 재검토 트리거

- 매 렌더 정화가 체감 지연을 만들 때 → 정화 결과 캐시.
- 자주 보는 피드의 정상 임베드가 허용목록 밖이라 손실될 때 → 호스트 추가.

## 참고

- OWASP XSS Prevention, `sanitize-html` allowlist 옵션
