// 서버(prisma)와 클라이언트가 공유하는 타입/상수 — prisma import 없음(클라이언트 번들 안전).

/** 무한 스크롤 한 묶음 크기 */
export const PAGE_SIZE = 30;

/** 주제 탭 순서 (ADR-0008). 'etc' = 미분류. */
export const TOPICS = [
  'frontend',
  'backend',
  'infra',
  'mobile',
  'ai',
  'data',
  'qa',
  'security',
  'etc',
] as const;

/** 주제 키 → 표시 라벨. */
export const TOPIC_LABELS: Record<string, string> = {
  frontend: '프론트엔드',
  backend: '백엔드',
  infra: '인프라/DevOps',
  mobile: '모바일',
  ai: 'AI/ML',
  data: '데이터',
  qa: 'QA/테스트',
  security: '보안',
  etc: '기타',
};

/** 목록 카드용 평탄화된 글 요약 (본문 제외) */
export interface ArticleCard {
  id: string;
  title: string;
  link: string;
  summary: string | null;
  author: string | null;
  publishedAt: Date | null;
  feedTitle: string;
  topics: string[];
  isRead: boolean;
  bookmarked: boolean;
}
