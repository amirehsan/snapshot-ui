import { Kbd } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

/** A keyboard table: each row is the keys, then what they do. */
export function Keys({ rows }: { rows: [keys: string, action: string][] }): ReactElement {
  return (
    <div className="keys">
      {rows.map(([keys, action]) => (
        <div className="key-row" key={keys}>
          <span>
            {keys.split(' ').map((key) => (
              <Kbd key={key} style={{ marginRight: 6 }}>
                {key}
              </Kbd>
            ))}
          </span>
          <span>{action}</span>
        </div>
      ))}
    </div>
  );
}
