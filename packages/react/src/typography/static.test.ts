import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const read = (file: string): string => readFileSync(join(here, file), 'utf8');

describe.each(['Heading.tsx', 'Text.tsx', 'Eyebrow.tsx'])('typography/%s', (file) => {
  it('is a server component: no client directive', () => {
    expect(read(file)).not.toMatch(/^\s*['"]use client['"]/m);
  });

  it('does not import React Aria, which would pull a client module into a server tree', () => {
    expect(read(file)).not.toContain('react-aria-components');
  });
});
