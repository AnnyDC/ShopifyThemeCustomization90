import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const locale = JSON.parse(read('locales/en.default.json'));
JSON.parse(read('config/settings_schema.json'));
JSON.parse(read('config/settings_data.json'));
let checks = 0;
for (const folder of ['templates', 'sections']) {
  for (const name of readdirSync(new URL(folder, root), { recursive: true })) {
    if (!name.endsWith('.json')) continue;
    const path = join(folder, name); const template = JSON.parse(read(path)); checks++;
    for (const section of Object.values(template.sections || {})) if (!existsSync(new URL(`sections/${section.type}.liquid`, root))) throw new Error(`Missing section ${section.type} in ${path}`);
    for (const id of template.order || []) if (!template.sections[id]) throw new Error(`Missing ordered section ${id} in ${path}`);
  }
}
for (const folder of ['sections','snippets','layout']) for (const name of readdirSync(new URL(folder, root))) {
  if (!name.startsWith('demo') || !name.endsWith('.liquid')) continue;
  const source = read(`${folder}/${name}`);
  const schema = source.match(/{% schema %}([\s\S]*?){% endschema %}/); if (schema) { JSON.parse(schema[1]); checks++; }
  for (const match of source.matchAll(/'([\w.]+)'\s*\|\s*t(?:\s|:|\})/g)) {
    const value = match[1].split('.').reduce((object, key) => object?.[key], locale); if (value === undefined) throw new Error(`Missing translation ${match[1]} in ${folder}/${name}`); checks++;
  }
  for (const match of source.matchAll(/render\s+'([^']+)'/g)) if (!existsSync(new URL(`snippets/${match[1]}.liquid`,root))) throw new Error(`Missing snippet ${match[1]}`);
}
console.log(`Theme structure, schemas, and translations: ${checks} checks passed. This does not replace Shopify Theme Check or storefront verification.`);
