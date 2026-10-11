// Two guarantees a Next.js App Router consumer needs from this package:
// 1. every source module that imports react-aria-components declares
//    'use client', because React Aria throws when a server component imports it;
// 2. the build kept that directive as the first statement of the emitted file.
import { glob, readFile } from 'node:fs/promises';

const DIRECTIVE = /^['"]use client['"];/;
let failed = false;

for await (const src of glob(['src/**/*.ts', 'src/**/*.tsx'])) {
  if (/\.(test|stories)\.tsx?$/.test(src)) continue;
  const code = await readFile(src, 'utf8');
  const declares = DIRECTIVE.test(code);
  if (/from ['"]react-aria-components/.test(code) && !declares) {
    console.error(`${src} imports react-aria-components without 'use client'`);
    failed = true;
    continue;
  }
  if (!declares) continue;
  const out = src.replace(/^src\//, 'dist/').replace(/\.tsx?$/, '.js');
  const emitted = await readFile(out, 'utf8').catch(() => '');
  if (!DIRECTIVE.test(emitted)) {
    console.error(`${out} lost its 'use client' directive`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log('check-use-client: every client module keeps its directive');
