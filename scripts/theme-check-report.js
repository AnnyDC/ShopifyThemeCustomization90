import { spawnSync, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { relative } from 'node:path';
const result = process.platform === 'win32' ? spawnSync('cmd.exe', ['/d','/s','/c','npx.cmd --yes @shopify/cli theme check --output json'], { encoding: 'utf8' }) : spawnSync('npx',['--yes','@shopify/cli','theme','check','--output','json'],{ encoding:'utf8' });
const reports = JSON.parse(result.stdout);
const summary = reports.map((report) => {
  const path = relative(process.cwd(), report.path).replaceAll('\\','/'); let unchanged = false;
  try { const original = execFileSync('git',['show',`HEAD:${path}`]); unchanged = original.toString('utf8').replaceAll('\r\n','\n') === readFileSync(report.path,'utf8').replaceAll('\r\n','\n'); } catch {}
  return { path, errors: report.errorCount, warnings: report.warningCount, unchangedFromOriginal: unchanged, offenses: report.offenses };
});
writeFileSync('docs/theme-check-results.json',JSON.stringify(summary,null,2)+'\n');
const totals = summary.reduce((totals,item) => ({ errors: totals.errors + item.errors, warnings: totals.warnings + item.warnings }),{errors:0,warnings:0});
const newFiles = summary.filter((item) => /(^|\/)demo[.-]/.test(item.path));
console.log(JSON.stringify({ exitCode: result.status, ...totals, demoFileIssues: newFiles, filesWithIssues: summary.map(({path,errors,warnings,unchangedFromOriginal}) => ({path,errors,warnings,unchangedFromOriginal})) },null,2));
process.exitCode = newFiles.length ? 1 : 0;
