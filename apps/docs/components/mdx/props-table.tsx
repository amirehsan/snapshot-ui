import type { ReactElement, ReactNode } from 'react';
import { generator } from '@/lib/props';

/** JSDoc descriptions use backticks for code; render those spans as code. */
function inline(text: string): ReactNode[] {
  return text.split('`').map((part, index) => (index % 2 === 1 ? <code key={index}>{part}</code> : part));
}

/**
 * Props from the library's own types and JSDoc. `type` is usually a Pick of
 * the component's props: React Aria's inherited props include dozens of DOM
 * events nobody needs listed.
 */
export async function PropsTable({ path, type }: { path: string; type: string }): Promise<ReactElement> {
  const [doc] = await generator.generateTypeTable(
    { path, type },
    { typeSimplifier: { shouldSimplify: () => false } },
  );
  const entries = [...(doc?.entries ?? [])].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="props">
      {entries.map((entry) => {
        const fallback = entry.tags.find((tag) => tag.name === 'default')?.text;
        return (
          <div className="prop" key={entry.name}>
            <div>
              <div className="prop-name">{entry.name}</div>
              <span className="prop-type">{entry.type.replace(/ \| undefined$/, '')}</span>
            </div>
            <div>
              <p>{inline(entry.description)}</p>
              {fallback ? <p className="prop-default">Default: {fallback}</p> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
