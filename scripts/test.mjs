// 모든 *.test.ts를 tsc로 컴파일한 뒤 Node로 실행합니다. 사용: pnpm test
import { spawnSync } from 'node:child_process';
import { readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outRoot = join(tmpdir(), 'restructuring-home-tests');
const suites = [
  { name: 'mobile', source: 'apps/mobile/src', cwd: 'apps/mobile' },
  { name: 'get-recommendations', source: 'supabase/functions/get-recommendations', cwd: '.' },
];
const tsc = join(root, 'node_modules/typescript/bin/tsc');

rmSync(outRoot, { recursive: true, force: true });
let failed = 0;

for (const suite of suites) {
  const sourceDir = join(root, suite.source);
  const tests = readdirSync(sourceDir, { recursive: true })
    .map(String)
    .filter((file) => file.endsWith('.test.ts'))
    .map((file) => join(sourceDir, file));
  const outDir = join(outRoot, suite.name);
  const compiled = spawnSync(process.execPath, [
    tsc, '--module', 'commonjs', '--moduleResolution', 'node', '--target', 'es2022', '--lib', 'es2022,dom',
    '--esModuleInterop', '--skipLibCheck', '--types', 'node', '--outDir', outDir, '--rootDir', sourceDir, ...tests,
  ], { cwd: root, stdio: 'inherit' });
  if (compiled.status !== 0) {
    console.error(`✗ ${suite.name}: 컴파일 실패`);
    failed += 1;
    continue;
  }

  for (const test of tests) {
    const label = relative(root, test).split(sep).join('/');
    const output = join(outDir, relative(sourceDir, test)).replace(/\.ts$/, '.js');
    const run = spawnSync(process.execPath, [output], { cwd: join(root, suite.cwd), encoding: 'utf8' });
    if (run.status === 0) {
      console.log(`✓ ${label}`);
    } else {
      failed += 1;
      console.error(`✗ ${label}\n${(run.stderr || run.stdout).trim()}`);
    }
  }
}

if (failed) {
  console.error(`\n실패 ${failed}건`);
  process.exit(1);
}
console.log('\n모든 테스트 통과');
