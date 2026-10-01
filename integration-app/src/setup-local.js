import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
if (existsSync('.env')) {
  console.log('Existing .env preserved. Configure missing values locally.');
} else {
  const template = readFileSync(new URL('../.env.example', import.meta.url), 'utf8');
  const content = template.replace('local-demo-signature-only', randomBytes(32).toString('hex')).replace('replace-with-a-random-local-token', randomBytes(32).toString('hex')).replace('replace-with-another-random-local-token', randomBytes(32).toString('hex'));
  writeFileSync('.env', content, { flag: 'wx', mode: 0o600 });
  console.log('Created ignored .env with random local mock credentials. No Shopify credentials were configured.');
}
mkdirSync('data', { recursive: true });
