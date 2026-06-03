const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

/** 목록/상세 공통 날짜 표기. null이면 빈 문자열. */
export function formatDate(date: Date | null | undefined): string {
  if (!date) return '';
  return dateFormatter.format(date);
}
