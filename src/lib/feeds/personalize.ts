import { cache } from 'react';

import { prisma } from '@/lib/prisma';

import { hasKeyword, matchedKeywords } from './keyword-match';

/** 개인화 프로필 (ADR-0009) — DB Profile.data(Json) 구조 */
export interface PersonalProfile {
  companyStack: { weight: number; keywords: string[] };
  diversify: { weight: number; keywords: string[] };
  learning: { key: string; label: string; weight: number; keywords: string[] }[];
  todoCues: string[];
}

export interface PersonalResult {
  score: number;
  tags: string[];
}

const EMPTY: PersonalResult = { score: 0, tags: [] };

/**
 * 글 텍스트(제목+요약)를 프로필에 매칭해 관련도 점수 + 표시 태그 산출.
 * score = Σ(매칭 키워드 수 × 그룹 가중). 태그는 켜진 신호별로 사람이 읽을 라벨.
 */
export function scorePersonal(text: string, profile: PersonalProfile | null): PersonalResult {
  if (!profile) return EMPTY;
  const hay = text.toLowerCase();
  let score = 0;
  const tags: string[] = [];

  // 회사 스택
  const company = matchedKeywords(hay, profile.companyStack.keywords);
  if (company.length > 0) {
    score += company.length * profile.companyStack.weight;
    tags.push(...company.slice(0, 2).map((k) => `회사·${k}`));
  }

  // 학습 우선순위 (profile.learning은 가중 내림차순). 점수는 모든 매칭 합산하되,
  // 카드 태그는 노이즈 억제를 위해 "가장 우선순위 높은 매칭 1개"만 노출.
  let learningHit = false;
  for (const area of profile.learning) {
    const m = matchedKeywords(hay, area.keywords);
    if (m.length > 0) {
      score += m.length * area.weight;
      if (!learningHit) tags.push(`학습·${area.label}`);
      learningHit = true;
    }
  }

  // 다양화 (회사 스택의 대안)
  const div = matchedKeywords(hay, profile.diversify.keywords);
  if (div.length > 0) {
    score += div.length * profile.diversify.weight;
    tags.push('다양화');
  }

  // 해볼 것: 학습 영역 매칭 + 구축/실습 류 신호
  if (learningHit && profile.todoCues.some((c) => hasKeyword(hay, c))) {
    tags.push('해볼것');
  }

  return { score, tags };
}

/** DB에서 개인화 프로필 로드 (단일 행). 요청 내 1회로 메모이즈. 없으면 null. */
export const getProfile = cache(async (): Promise<PersonalProfile | null> => {
  const row = await prisma.profile.findUnique({ where: { id: 'default' } });
  return (row?.data as unknown as PersonalProfile | undefined) ?? null;
});
