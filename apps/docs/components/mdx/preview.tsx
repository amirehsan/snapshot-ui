import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ReactElement } from 'react';
import { examples, type ExampleName } from '@/examples';
import { Code } from './code';
import { PreviewTabs } from './preview-tabs';

/**
 * A live example and its source, read from disk at build time, so the code
 * shown is always the code running. `wide` gives the example the content
 * grid's full width at every window width, for a part that changes with its
 * own box, as a data table's columns do: on its page the side column folds
 * under the content from 1440px too, as it does under 1440px.
 */
export async function Preview({
  name,
  wide = false,
}: {
  name: ExampleName;
  wide?: boolean;
}): Promise<ReactElement> {
  const Example = examples[name];
  const source = await readFile(path.join(process.cwd(), 'examples', `${name}.tsx`), 'utf8');
  return <PreviewTabs preview={<Example />} code={<Code code={source} />} wide={wide} />;
}
