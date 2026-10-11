'use client';

import { useId, useState, type KeyboardEvent, type ReactElement, type ReactNode } from 'react';

const TABS = ['Preview', 'Code'] as const;

/** Preview and Code as WAI-ARIA tabs: arrow keys move, the selected tab is the ink pill. */
export function PreviewTabs({ preview, code }: { preview: ReactNode; code: ReactNode }): ReactElement {
  const id = useId();
  const [selected, setSelected] = useState<(typeof TABS)[number]>('Preview');

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next = selected === 'Preview' ? 'Code' : 'Preview';
    setSelected(next);
    document.getElementById(`${id}-tab-${next}`)?.focus();
  };

  return (
    <div className="preview">
      <div className="preview-head">
        <p className="eyebrow">Example</p>
        <div className="tabs" role="tablist" aria-label="Example">
          {TABS.map((tab) => (
            <button
              key={tab}
              id={`${id}-tab-${tab}`}
              className="tab"
              type="button"
              role="tab"
              aria-selected={selected === tab}
              aria-controls={`${id}-panel-${tab}`}
              tabIndex={selected === tab ? 0 : -1}
              onClick={() => {
                setSelected(tab);
              }}
              onKeyDown={onKeyDown}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      <div
        id={`${id}-panel-Preview`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-Preview`}
        hidden={selected !== 'Preview'}
      >
        <div className="stage">{preview}</div>
        <div className="stage-bar">
          <span>Follows the page theme and corners</span>
        </div>
      </div>
      <div
        id={`${id}-panel-Code`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-Code`}
        hidden={selected !== 'Code'}
      >
        {code}
      </div>
    </div>
  );
}
