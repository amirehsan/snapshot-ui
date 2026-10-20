import { Prose, ProseScroll } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

const ROWS = [
  ['Rent', '$1,450.00', '$1,450.00', '$0.00', '44%', '$1,450.00'],
  ['Groceries', '$588.15', '$612.40', '+$24.25', '19%', '$650.00'],
  ['Eating out', '$431.00', '$286.90', '-$144.10', '9%', '$300.00'],
  ['Transport', '$214.60', '$198.30', '-$16.30', '6%', '$250.00'],
  ['Utilities', '$176.20', '$181.75', '+$5.55', '6%', '$200.00'],
];

/** Six columns of figures in a ProseScroll: on a phone the table scrolls inside its named region, not the page. */
export default function ProseWideTable(): ReactElement {
  return (
    <Prose style={{ width: '100%' }}>
      <p>
        Each category against September and its budget, with <mark>eating out</mark> down the most.
      </p>
      <ProseScroll aria-label="October by category, table">
        <table>
          <thead>
            <tr>
              <th scope="col">Category</th>
              {['September', 'October', 'Change', 'Share', 'Budget'].map((name) => (
                <th key={name} scope="col" style={{ textAlign: 'end' }}>
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([category = '', ...figures]) => (
              <tr key={category}>
                <th scope="row">{category}</th>
                {figures.map((figure, index) => (
                  <td key={index} style={{ textAlign: 'end' }}>
                    {figure}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </ProseScroll>
    </Prose>
  );
}
