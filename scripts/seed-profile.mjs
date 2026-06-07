// 개인화 프로필 시드 (ADR-0009)
// config/profile.local.json(gitignore)을 읽어 DB Profile 단일 행에 upsert.
// 실행: export PATH="$HOME/.nvm/versions/node/v22.18.0/bin:$PATH" && node scripts/seed-profile.mjs

import 'dotenv/config';
import { readFileSync } from 'node:fs';

import { neon } from '@neondatabase/serverless';

const path = 'config/profile.local.json';
let data;
try {
  data = JSON.parse(readFileSync(path, 'utf8'));
} catch {
  console.error(`${path} 를 읽을 수 없습니다. config/profile.example.json 복사해서 채우세요.`);
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
await sql`
  INSERT INTO profile (id, data, "updatedAt")
  VALUES ('default', ${JSON.stringify(data)}::jsonb, now())
  ON CONFLICT (id) DO UPDATE SET data = ${JSON.stringify(data)}::jsonb, "updatedAt" = now()`;

const company = data.companyStack?.keywords?.length ?? 0;
const learning = data.learning?.length ?? 0;
console.log(`프로필 저장: 회사스택 ${company}개 키워드, 학습영역 ${learning}개`);
