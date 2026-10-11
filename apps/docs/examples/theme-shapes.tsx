'use client';

import { Button } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

const SHAPES = ['rounded', 'soft', 'square'] as const;

export default function ThemeShapes(): ReactElement {
  return (
    <div className="shape-samples">
      {SHAPES.map((shape) => (
        <div key={shape} className="shape-sample" data-shape={shape}>
          <p className="eyebrow">{shape}</p>
          <div className="row">
            <Button>Book a visit</Button>
          </div>
          <div className="card" style={{ padding: 20 }}>
            A card, cut {shape}.
          </div>
        </div>
      ))}
    </div>
  );
}
