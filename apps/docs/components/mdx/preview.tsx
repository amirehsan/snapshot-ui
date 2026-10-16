import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ReactElement } from 'react';
import { examples, type ExampleName } from '@/examples';
import { Code } from './code';
import { PreviewTabs } from './preview-tabs';

/**
 * A live example and its source, read from disk at build time, so the code
 * shown is always the code running.
 */
export async function Preview({ name }: { name: ExampleName }): Promise<ReactElement> {
  const Example = examples[name];
  const source = await readFile(path.join(process.cwd(), 'examples', `${name}.tsx`), 'utf8');
  return <PreviewTabs preview={<Example />} code={<Code code={source} />} />;
}
