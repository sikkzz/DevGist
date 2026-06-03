// lint-staged 룰 — 단일 Next.js 앱.
// staged 파일만 ESLint --fix + Prettier 적용.

module.exports = {
  '*.{ts,tsx,js,jsx,mjs,cjs}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,yaml,yml,css}': ['prettier --write'],
};
