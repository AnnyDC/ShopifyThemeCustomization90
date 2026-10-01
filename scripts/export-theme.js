import { cpSync, mkdirSync, existsSync } from 'node:fs';
const target = new URL('../theme-export/',import.meta.url);
if (existsSync(target)) throw new Error('theme-export exists. Review and move it before exporting again.');
mkdirSync(target);
for (const folder of ['assets','config','layout','locales','sections','snippets','templates']) cpSync(new URL(`../${folder}`,import.meta.url),new URL(folder,target),{recursive:true});
console.log('Created theme-export containing Shopify theme folders only. Review before connecting it to the unpublished demo theme.');
