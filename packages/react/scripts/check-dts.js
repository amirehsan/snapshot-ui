// The type declarations an app's editor shows are the package's public words: they never cite the specs,
// plans and reviews the library was built from, such as "(ruling 2)", "(spec correction 21)", "(amendment 3)",
// "(spec 7.2)" or "(risk R4)", which mean nothing to a reader of the package.
// The guard fails closed: a run that finds no declaration file is an error.
//
// Usage: node scripts/check-dts.js [packageRoot]  (default: the current directory)
import { glob, readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

const INTERNAL =
  /\b(?:ruling \d|rulings \d|spec corrections? \d|amendments? \d|spec \d+(?:\.\d+)?\b|risk R\d|R[1-9]\b)/i;

const root = resolve(process.argv[2] ?? process.cwd());
const files = [];
for await (const file of glob('dist/**/*.d.ts', { cwd: root })) files.push(file.split(sep).join('/'));
files.sort();

if (files.length === 0) {
  console.error(`check-dts: no declaration file under ${root}/dist; build first.`);
  process.exit(1);
}

let failed = false;
for (const file of files) {
  const lines = (await readFile(resolve(root, file), 'utf8')).split('\n');
  lines.forEach((line, index) => {
    const found = INTERNAL.exec(line);
    if (found !== null) {
      console.error(
        `${file}:${String(index + 1)} cites "${found[0]}", an internal reference: ${line.trim()}`,
      );
      failed = true;
    }
  });
}

if (failed) process.exit(1);
console.log(`check-dts: ${String(files.length)} declaration files cite nothing internal.`);
