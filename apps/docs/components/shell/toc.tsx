'use client';

import { AnchorProvider, TOCItem, type TOCItemType } from 'fumadocs-core/toc';
import type { ReactElement } from 'react';

/** The page's sections. Fumadocs tracks which one is in view and marks it data-active. */
export function Toc({ items }: { items: TOCItemType[] }): ReactElement {
  return (
    <AnchorProvider toc={items} single>
      <ul className="toc">
        {items.map((item) => (
          <li key={item.url}>
            <TOCItem href={item.url}>{item.title}</TOCItem>
          </li>
        ))}
      </ul>
    </AnchorProvider>
  );
}
