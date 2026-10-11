import { Kbd } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function KbdKeys(): ReactElement {
  return (
    <div className="row" style={{ justifyContent: 'center', gap: 24 }}>
      <span>
        <Kbd>&#8984;</Kbd> <Kbd>K</Kbd> to search
      </span>
      <span>
        <Kbd>&#8593;</Kbd> <Kbd>&#8595;</Kbd> to move, <Kbd>&#8629;</Kbd> to open
      </span>
      <span>
        <Kbd>esc</Kbd> to close
      </span>
    </div>
  );
}
