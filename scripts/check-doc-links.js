import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
const documents = ['README.md','integration-app/README.md',...readdirSync('docs').filter((name) => name.endsWith('.md')).map((name) => `docs/${name}`)];
let count = 0;
for (const path of documents) for (const match of readFileSync(path,'utf8').matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
  const target = match[1]; if (/^https?:|^#/.test(target)) continue;
  if (!existsSync(resolve(dirname(path),target.split('#')[0]))) throw new Error(`Missing documentation link ${target} in ${path}`);
  count++;
}
console.log(`${documents.length} documents checked; ${count} local links resolve.`);
