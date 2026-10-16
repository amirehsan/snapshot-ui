import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const SCRIPT = resolve(dirname(fileURLToPath(import.meta.url)), '../scripts/check-dts.js');

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function run(files: Record<string, string>): { status: number | null; output: string } {
  const root = mkdtempSync(join(realpathSync(tmpdir()), 'check-dts-'));
  roots.push(root);
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  const result = spawnSync(process.execPath, [SCRIPT, root], { encoding: 'utf8' });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

describe('check-dts', () => {
  it('passes declarations in plain words', () => {
    const { status } = run({
      'dist/index.d.ts':
        "/** The row's detail, a URL the router opens. */\nexport declare const a: string;\n",
    });
    expect(status).toBe(0);
  });

  it.each(['(ruling 2)', '(spec correction 21)', '(amendment 3)', '(spec 7.2)', '(risk R4)', '(R6)'])(
    'fails a declaration that cites %s',
    (cite) => {
      const { status, output } = run({
        'dist/a/A.d.ts': `/** Opens the row ${cite}. */\nexport declare const a: 1;\n`,
      });
      expect(status).toBe(1);
      expect(output).toContain('dist/a/A.d.ts:1');
    },
  );

  it('fails closed when there is nothing to check', () => {
    expect(run({ 'src/index.ts': '' }).status).toBe(1);
  });
});
