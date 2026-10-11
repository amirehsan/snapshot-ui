import type { ReactElement } from 'react';

/** A keyboard table: each row is the keys, then what they do. */
export function Keys({ rows }: { rows: [keys: string, action: string][] }): ReactElement {
  return (
    <div className="keys">
      {rows.map(([keys, action]) => (
        <div className="key-row" key={keys}>
          <span>
            {keys.split(' ').map((key) => (
              <span className="kbd" key={key} style={{ marginRight: 6 }}>
                {key}
              </span>
            ))}
          </span>
          <span>{action}</span>
        </div>
      ))}
    </div>
  );
}
