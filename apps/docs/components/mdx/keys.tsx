import { Kbd } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

/**
 * A keyboard table: each row is the keys, then what they do. The keys are the
 * row's header, so a screen reader announces them with the action.
 */
export function Keys({ rows }: { rows: [keys: string, action: string][] }): ReactElement {
  return (
    <table className="keys" aria-label="Keyboard">
      <tbody>
        {rows.map(([keys, action]) => (
          <tr className="key-row" key={keys}>
            <th scope="row">
              {keys.split(' ').map((key) => (
                <Kbd key={key} style={{ marginRight: 6 }}>
                  {key}
                </Kbd>
              ))}
            </th>
            <td>{action}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
