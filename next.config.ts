import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // jsdom은 내부 dynamic require가 많아 서버리스 번들링 시 깨진다.
  // 번들에서 제외하고 런타임에 node_modules에서 require하게 한다. (/api/cron/poll 500 방지)
  serverExternalPackages: ['jsdom'],
};

export default nextConfig;
