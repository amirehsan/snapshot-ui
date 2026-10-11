import type { ReactElement } from 'react';

/** The design rules for a component: what to do, then what never to do. */
export function Rules({ dos, donts }: { dos: string[]; donts: string[] }): ReactElement {
  return (
    <div className="rules">
      {dos.map((rule) => (
        <div className="rule" key={rule}>
          <span className="rule-mark" role="img" aria-label="Do">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="m5 12.5 5 5 9-10" />
            </svg>
          </span>
          <p>{rule}</p>
        </div>
      ))}
      {donts.map((rule) => (
        <div className="rule" key={rule}>
          <span className="rule-mark rule-mark-no" role="img" aria-label="Do not">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </span>
          <p>{rule}</p>
        </div>
      ))}
    </div>
  );
}
