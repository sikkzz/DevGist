// 피드 시드 스크립트 (피드 관리 UI 전까지 사용)
// 실행: export PATH="$HOME/.nvm/versions/node/v22.18.0/bin:$PATH" && node scripts/seed-feeds.mjs
// url 기준 ON CONFLICT DO NOTHING (재실행 안전). 전체 교체는 reseed 시 feeds 비우고 실행.
//
// 한국 빅테크 + 유명 IT 플랫폼 스타트업 기술블로그.
// 전부 fetch 검증 완료(awesome-devblog db_community.yml 등 큐레이션 기반).
// 정직한 UA로 접근 가능한 공개 RSS만 — 차단 피드는 존중해 제외:
//   403(봇 차단): 우아한형제들 신블로그(woowabros 구블로그는 사용)·컬리
//   406(Accept 헤더 거부): G마켓·GS Retail (parser에 Accept:*/* 추가로 해결 가능 — 미검증이라 보류)
//   ※ 네이버 D2도 같은 406이었으나 원인은 UA가 아닌 Accept 헤더였음. parse.ts에 Accept:*/*
//     추가로 정직 UA 그대로 수집됨 → 포함(첫 설계의 'UA 거부' 진단은 오귀인이었다)
// (카카오뱅크는 /rss는 403이나 카테고리 index.xml로 수집 가능 → 포함)

import 'dotenv/config';
import { randomUUID } from 'node:crypto';

import { neon } from '@neondatabase/serverless';

const FEEDS = [
  // --- 대기업 / 빅테크 ---
  // (카카오 tech.kakao.com 제외: SPA(JS렌더)라 본문 정적 추출 불가, 요약만 남음)
  {
    title: '네이버 플레이스',
    url: 'https://medium.com/feed/naver-place-dev',
    siteUrl: 'https://medium.com/naver-place-dev',
    category: 'bigtech',
  },
  {
    title: '네이버 클라우드 플랫폼',
    url: 'https://rss.blog.naver.com/n_cloudplatform.xml',
    siteUrl: 'https://blog.naver.com/n_cloudplatform',
    category: 'bigtech',
  },
  {
    title: '네이버 D2',
    url: 'https://d2.naver.com/d2.atom',
    siteUrl: 'https://d2.naver.com',
    category: 'bigtech',
  },
  {
    title: 'LINE',
    url: 'https://techblog.lycorp.co.jp/ko/feed/index.xml',
    siteUrl: 'https://techblog.lycorp.co.jp/ko',
    category: 'bigtech',
  },
  {
    title: '쿠팡',
    url: 'https://medium.com/feed/coupang-tech',
    siteUrl: 'https://medium.com/coupang-tech',
    category: 'bigtech',
  },
  {
    title: 'AWS Korea',
    url: 'https://aws.amazon.com/ko/blogs/korea/feed/',
    siteUrl: 'https://aws.amazon.com/ko/blogs/korea/',
    category: 'bigtech',
  },
  {
    title: 'Google Developers Korea',
    url: 'http://feeds.feedburner.com/GoogleDevelopersKorea',
    siteUrl: 'https://developers-kr.googleblog.com',
    category: 'bigtech',
  },
  {
    title: '삼성 SDS',
    url: 'https://www.samsungsds.com/kr/insights/insight_ko_rss.xml',
    siteUrl: 'https://www.samsungsds.com/kr/insights/',
    category: 'bigtech',
  },
  {
    title: 'Samsung Tech Blog',
    url: 'https://techblog.samsung.com/rss',
    siteUrl: 'https://techblog.samsung.com',
    category: 'bigtech',
  },
  {
    title: 'NHN Cloud',
    url: 'https://meetup.toast.com/rss',
    siteUrl: 'https://meetup.toast.com',
    category: 'bigtech',
  },
  {
    title: 'NHN TOAST UI',
    url: 'https://ui.toast.com/rss.xml',
    siteUrl: 'https://ui.toast.com',
    category: 'bigtech',
  },
  {
    title: 'SK플래닛',
    url: 'https://techtopic.skplanet.com/rss.xml',
    siteUrl: 'https://techtopic.skplanet.com',
    category: 'bigtech',
  },
  {
    title: '우아한형제들',
    url: 'https://woowabros.github.io/feed.xml',
    siteUrl: 'https://woowabros.github.io',
    category: 'bigtech',
  },

  // --- 플랫폼 스타트업 ---
  {
    title: '토스',
    url: 'https://toss.tech/rss.xml',
    siteUrl: 'https://toss.tech',
    category: 'startup',
  },
  {
    title: '당근',
    url: 'https://medium.com/feed/daangn',
    siteUrl: 'https://medium.com/daangn',
    category: 'startup',
  },
  {
    title: '쏘카',
    url: 'https://tech.socarcorp.kr/feed.xml',
    siteUrl: 'https://tech.socarcorp.kr',
    category: 'startup',
  },
  {
    title: '직방',
    url: 'https://medium.com/feed/zigbang',
    siteUrl: 'https://medium.com/zigbang',
    category: 'startup',
  },
  {
    title: '무신사',
    url: 'https://medium.com/feed/musinsa-tech',
    siteUrl: 'https://medium.com/musinsa-tech',
    category: 'startup',
  },
  {
    title: '29CM',
    url: 'https://medium.com/feed/29cm',
    siteUrl: 'https://medium.com/29cm',
    category: 'startup',
  },
  {
    title: '요기요',
    url: 'https://techblog.yogiyo.co.kr/feed',
    siteUrl: 'https://techblog.yogiyo.co.kr',
    category: 'startup',
  },
  {
    title: '여기어때',
    url: 'https://techblog.gccompany.co.kr/feed',
    siteUrl: 'https://techblog.gccompany.co.kr',
    category: 'startup',
  },
  {
    title: '지그재그(카카오스타일)',
    url: 'https://devblog.kakaostyle.com/ko/index.xml',
    siteUrl: 'https://devblog.kakaostyle.com/ko',
    category: 'startup',
  },
  {
    title: '번개장터',
    url: 'https://medium.com/feed/bunjang-tech-blog',
    siteUrl: 'https://medium.com/bunjang-tech-blog',
    category: 'startup',
  },
  {
    title: '헤이딜러(PRND)',
    url: 'https://medium.com/feed/prnd',
    siteUrl: 'https://medium.com/prnd',
    category: 'startup',
  },
  {
    title: '리디(RIDI)',
    url: 'http://www.ridicorp.com/story-category/tech-blog/feed/',
    siteUrl: 'https://www.ridicorp.com',
    category: 'startup',
  },
  {
    title: '야놀자',
    url: 'https://medium.com/feed/yanolja',
    siteUrl: 'https://medium.com/yanolja',
    category: 'startup',
  },
  {
    title: '뱅크샐러드',
    url: 'https://blog.banksalad.com/rss.xml',
    siteUrl: 'https://blog.banksalad.com',
    category: 'startup',
  },
  {
    title: '핀다',
    url: 'https://medium.com/feed/finda-tech',
    siteUrl: 'https://medium.com/finda-tech',
    category: 'startup',
  },
  {
    title: '원티드',
    url: 'https://medium.com/feed/wantedjobs',
    siteUrl: 'https://medium.com/wantedjobs',
    category: 'startup',
  },
  {
    title: '사람인',
    url: 'https://saramin.github.io/feed.xml',
    siteUrl: 'https://saramin.github.io',
    category: 'startup',
  },
  {
    title: '크몽',
    url: 'https://medium.com/feed/kmong',
    siteUrl: 'https://medium.com/kmong',
    category: 'startup',
  },
  {
    title: '데브시스터즈',
    url: 'https://tech.devsisters.com/rss.xml',
    siteUrl: 'https://tech.devsisters.com',
    category: 'startup',
  },
  {
    title: '하이퍼커넥트',
    url: 'https://hyperconnect.github.io/feed.xml',
    siteUrl: 'https://hyperconnect.github.io',
    category: 'startup',
  },
  {
    title: '인프런',
    url: 'https://tech.inflab.com/rss.xml',
    siteUrl: 'https://tech.inflab.com',
    category: 'startup',
  },
  {
    title: '리멤버',
    url: 'https://tech.remember.co.kr/feed',
    siteUrl: 'https://tech.remember.co.kr',
    category: 'startup',
  },
  {
    title: '토스랩(잔디)',
    url: 'https://tosslab.github.io/feed.xml',
    siteUrl: 'https://tosslab.github.io',
    category: 'startup',
  },
  {
    title: 'Spoqa',
    url: 'https://spoqa.github.io/atom.xml',
    siteUrl: 'https://spoqa.github.io',
    category: 'startup',
  },
  {
    title: '스티비',
    url: 'https://blog.stibee.com/feed',
    siteUrl: 'https://blog.stibee.com',
    category: 'startup',
  },
  {
    title: '더핑크퐁컴퍼니',
    url: 'https://medium.com/feed/pinkfong',
    siteUrl: 'https://medium.com/pinkfong',
    category: 'startup',
  },

  // --- 추가 (2026-06): IT 스타트업/플랫폼 (awesome-devblog·elky84 검증) ---
  {
    title: '카카오뱅크',
    url: 'https://tech.kakaobank.com/categories/%EA%B8%B0%EC%88%A0-%EC%9D%B4%EC%95%BC%EA%B8%B0/index.xml',
    siteUrl: 'https://tech.kakaobank.com',
    category: 'bigtech',
  },
  {
    title: '토스페이먼츠',
    url: 'https://v2.velog.io/rss/tosspayments',
    siteUrl: 'https://velog.io/@tosspayments',
    category: 'startup',
  },
  {
    title: '넷마블',
    url: 'https://netmarble.engineering/feed/',
    siteUrl: 'https://netmarble.engineering',
    category: 'bigtech',
  },
  {
    title: '티몬',
    url: 'https://rss.blog.naver.com/tmondev.xml',
    siteUrl: 'https://blog.naver.com/tmondev',
    category: 'startup',
  },
  {
    title: 'ZUM인터넷',
    url: 'https://zuminternet.github.io/feed.xml',
    siteUrl: 'https://zuminternet.github.io',
    category: 'startup',
  },
  {
    title: '농심 NDS',
    url: 'https://tech.cloud.nongshim.co.kr/feed/',
    siteUrl: 'https://tech.cloud.nongshim.co.kr',
    category: 'bigtech',
  },
  {
    title: '이스트소프트',
    url: 'https://blog.est.ai/feed.xml',
    siteUrl: 'https://blog.est.ai',
    category: 'startup',
  },
  {
    title: '트렌비',
    url: 'https://tech.trenbe.com/feed',
    siteUrl: 'https://tech.trenbe.com',
    category: 'startup',
  },
  {
    title: '다나와',
    url: 'https://danawalab.github.io/feed',
    siteUrl: 'https://danawalab.github.io',
    category: 'startup',
  },
  {
    title: '딜리셔스(신상마켓)',
    url: 'https://dealicious-inc.github.io/feed.xml',
    siteUrl: 'https://dealicious-inc.github.io',
    category: 'startup',
  },
  {
    title: '테이블링',
    url: 'https://medium.com/feed/tabling-tech',
    siteUrl: 'https://medium.com/tabling-tech',
    category: 'startup',
  },
  {
    title: '휴먼스케이프',
    url: 'https://medium.com/feed/humanscape-tech',
    siteUrl: 'https://medium.com/humanscape-tech',
    category: 'startup',
  },
  {
    title: '일레클(나인투원)',
    url: 'https://medium.com/feed/elecle-bike',
    siteUrl: 'https://medium.com/elecle-bike',
    category: 'startup',
  },
  {
    title: '메디스트림',
    url: 'https://v2.velog.io/rss/medistream',
    siteUrl: 'https://velog.io/@medistream',
    category: 'startup',
  },
  {
    title: 'MakinaRocks',
    url: 'https://makinarocks.github.io/feed',
    siteUrl: 'https://makinarocks.github.io',
    category: 'startup',
  },
  {
    title: 'STCLab',
    url: 'https://medium.com/feed/stclab-tech-blog',
    siteUrl: 'https://medium.com/stclab-tech-blog',
    category: 'startup',
  },
  {
    title: '핀셋(Gitple)',
    url: 'https://tech.finset.io/atom.xml',
    siteUrl: 'https://tech.finset.io',
    category: 'startup',
  },
  {
    title: 'IMQA',
    url: 'https://blog.imqa.io/rss/',
    siteUrl: 'https://blog.imqa.io',
    category: 'startup',
  },
  {
    title: '큐브리드',
    url: 'https://www.cubrid.com/blog/rss',
    siteUrl: 'https://www.cubrid.com/blog',
    category: 'startup',
  },
  {
    title: '레몬베이스',
    url: 'https://medium.com/feed/lemonbase',
    siteUrl: 'https://medium.com/lemonbase',
    category: 'startup',
  },
  {
    title: '딜라이트룸(알라미)',
    url: 'https://medium.com/feed/delightroom',
    siteUrl: 'https://medium.com/delightroom',
    category: 'startup',
  },
  {
    title: '유니크굿컴퍼니',
    url: 'https://medium.com/feed/uniquegood',
    siteUrl: 'https://medium.com/uniquegood',
    category: 'startup',
  },
  // (인포그랩 제외: SPA(JS렌더)라 본문 정적 추출 불가)
  {
    title: '플라네타리움',
    url: 'https://snack.planetarium.dev/kor/index.xml',
    siteUrl: 'https://snack.planetarium.dev/kor',
    category: 'startup',
  },
  {
    title: '달리웍스',
    url: 'https://techblog.daliworks.net/feed.xml',
    siteUrl: 'https://techblog.daliworks.net',
    category: 'startup',
  },
  {
    title: '모두의연구소',
    url: 'https://medium.com/feed/modulabs',
    siteUrl: 'https://medium.com/modulabs',
    category: 'startup',
  },
  {
    title: '밀당(에듀테크)',
    url: 'https://medium.com/feed/mildang',
    siteUrl: 'https://medium.com/mildang',
    category: 'startup',
  },
  {
    title: '플랫팜(AR)',
    url: 'https://medium.com/feed/platfarm',
    siteUrl: 'https://medium.com/platfarm',
    category: 'startup',
  },
];

const sql = neon(process.env.DATABASE_URL);

let inserted = 0;
for (const f of FEEDS) {
  const rows = await sql`
    INSERT INTO feeds (id, title, url, "siteUrl", category, active, "createdAt", "updatedAt")
    VALUES (${randomUUID()}, ${f.title}, ${f.url}, ${f.siteUrl}, ${f.category}, true, now(), now())
    ON CONFLICT (url) DO NOTHING
    RETURNING id`;
  if (rows.length > 0) inserted += 1;
  console.log(`${rows.length > 0 ? '+ added' : '= exists'}: ${f.title}`);
}
console.log(`\nseed 완료: ${inserted} added / ${FEEDS.length} total`);
