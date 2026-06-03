import sanitizeHtml from 'sanitize-html';

// 신뢰 호스트 임베드만 허용 (ADR-0007)
const ALLOWED_IFRAME_HOSTS = [
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'player.vimeo.com',
  'codesandbox.io',
  'codepen.io',
];

// 인라인 SVG 다이어그램(Excalidraw 등) 보존용 — 구조/표현 태그만. (ADR-0007)
// 의도적 제외: script, foreignObject(HTML 밀반입), animate*/set(애니메이션 기반 우회).
const SVG_TAGS = [
  'svg',
  'g',
  'path',
  'rect',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'text',
  'tspan',
  'textPath',
  'defs',
  'symbol',
  'use',
  'image',
  'linearGradient',
  'radialGradient',
  'stop',
  'clipPath',
  'mask',
  'pattern',
  'marker',
  'title',
  'desc',
];

// SVG 표현 속성 — HTML 태그에 붙어도 무해하므로 '*'에 둔다 (이벤트 핸들러 없음).
const SVG_ATTRS = [
  'viewBox',
  'xmlns',
  'xmlns:xlink',
  'version',
  'preserveAspectRatio',
  'x',
  'y',
  'x1',
  'y1',
  'x2',
  'y2',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'd',
  'points',
  'transform',
  'gradientTransform',
  'gradientUnits',
  'spreadMethod',
  'offset',
  'fill',
  'fill-opacity',
  'fill-rule',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-opacity',
  'stroke-miterlimit',
  'opacity',
  'stop-color',
  'stop-opacity',
  'clip-path',
  'clip-rule',
  'mask',
  'marker-start',
  'marker-mid',
  'marker-end',
  'text-anchor',
  'dominant-baseline',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'letter-spacing',
  'color',
  'vector-effect',
  'paint-order',
];

const OPTIONS: sanitizeHtml.IOptions = {
  // 본문 구조 태그 + 이미지/임베드 + SVG (코드·링크는 기본 허용에 포함)
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(
    ['img', 'h1', 'h2', 'figure', 'figcaption', 'picture', 'source', 'iframe'],
    SVG_TAGS,
  ),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading'],
    source: ['src', 'srcset', 'type', 'media', 'sizes'],
    a: ['href', 'name', 'target', 'rel'],
    iframe: ['src', 'width', 'height', 'allow', 'allowfullscreen', 'title', 'loading'],
    code: ['class'], // 하이라이팅 언어 클래스 보존
    span: ['class'],
    // SVG 래스터/참조 — URL 속성은 아래 scheme 필터가 적용됨
    image: ['href', 'xlink:href', 'width', 'height', 'x', 'y', 'preserveAspectRatio'],
    use: ['href', 'xlink:href', 'x', 'y', 'width', 'height'],
    '*': ['id', 'class', 'width', 'height', ...SVG_ATTRS],
  },
  // javascript: 등 위험 스킴 차단. data:는 인라인 이미지(img/image)에만 허용 → 무손실 유지하되 data:text/html 방지
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: {
    img: ['http', 'https', 'data'],
    image: ['http', 'https', 'data'],
  },
  // 스킴 검사를 xlink:href에도 적용 → svg 내 javascript: 우회 차단
  allowedSchemesAppliedToAttributes: ['href', 'src', 'cite', 'xlink:href'],
  allowedIframeHostnames: ALLOWED_IFRAME_HOSTS,
  // SVG는 camelCase 태그/속성(clipPath, viewBox 등)이라 소문자화하면 깨짐 → case 보존
  parser: { lowerCaseTags: false, lowerCaseAttributeNames: false },
  // 외부 링크는 새 탭 + 안전 rel
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', {
      target: '_blank',
      rel: 'noopener noreferrer nofollow',
    }),
  },
};

/**
 * 외부 출처 본문 HTML을 렌더 직전 정화한다 (ADR-0007).
 * 원문은 DB에 raw로 보존되고, 이 함수는 출력용 사본만 만든다.
 * `<script>`/이벤트 핸들러/위험 스킴/`<foreignObject>`는 제거, 코드·이미지·링크·인라인 SVG는 보존.
 */
export function sanitizeArticleHtml(dirty: string): string {
  return sanitizeHtml(dirty, OPTIONS);
}
