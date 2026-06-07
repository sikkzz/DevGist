// 로그인 계정 시드 (ADR-0010) — 회원가입 없음, 본인 1계정.
// config/account.local.json(gitignore)을 읽어 DB users에 upsert(username 기준).
// 실행: export PATH="$HOME/.nvm/versions/node/v22.18.0/bin:$PATH" && node scripts/seed-account.mjs

import 'dotenv/config';
import { randomBytes, randomUUID, scryptSync } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { neon } from '@neondatabase/serverless';

// auth.ts의 hashPassword와 동일 포맷 (salt:scrypt-hex, keylen 64)
function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

let account;
try {
  account = JSON.parse(readFileSync('config/account.local.json', 'utf8'));
} catch {
  console.error('config/account.local.json 없음. config/account.example.json 복사해서 채우세요.');
  process.exit(1);
}
if (!account.username || !account.password) {
  console.error('username/password 필요.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const hash = hashPassword(account.password);
await sql`
  INSERT INTO users (id, username, "passwordHash", "createdAt")
  VALUES (${randomUUID()}, ${account.username}, ${hash}, now())
  ON CONFLICT (username) DO UPDATE SET "passwordHash" = ${hash}`;

console.log(`계정 시드 완료: ${account.username} (비번 변경 시 재실행). 기존 세션은 유지됨.`);
