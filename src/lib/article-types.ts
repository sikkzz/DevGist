// 서버(prisma)와 클라이언트가 공유하는 타입/상수 — prisma import 없음(클라이언트 번들 안전).

/** 무한 스크롤 한 묶음 크기 */
export const PAGE_SIZE = 30;

/** 피드 category 키 → 표시 라벨. 미정의 키는 키 그대로 노출(폴백). */
export const CATEGORY_LABELS: Record<string, string> = {
  bigtech: '빅테크',
  startup: '스타트업',
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
  isRead: boolean;
  bookmarked: boolean;
}
