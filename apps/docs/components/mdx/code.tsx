import { codeToHtml, createCssVariablesTheme } from 'shiki';
import type { ReactElement } from 'react';
import { CopyButton } from './copy-button';

// Every token color is a CSS variable, mapped onto the palette in site.css, so
// code follows the color mode and never borrows a reserved color.
const theme = createCssVariablesTheme({ name: 'snapshot', variablePrefix: '--shiki-' });

/**
 * Highlighted on the server, with a copy button. A page does not write it out: a
 * fenced block in an MDX page becomes one (see lib/remark-code.ts), and an
 * example's source is shown by Preview.
 */
export async function Code({ code, lang = 'tsx' }: { code: string; lang?: string }): Promise<ReactElement> {
  const source = code.trim();
  const html = await codeToHtml(source, { lang, theme });
  return (
    <div className="code">
      {/* Shiki's output for our own example source, rendered on the server. */}
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <CopyButton text={source} />
    </div>
  );
}
