import { describe, expect, it } from 'vitest';
import { placeReadout, READOUT_EDGES, READOUT_GAP, READOUT_LINE, readoutAlign } from './readout';

describe('placeReadout', () => {
  it('knows its sizes before anything is drawn: a 20px line, 14px of edges and a 10px gap', () => {
    expect([READOUT_LINE, READOUT_EDGES, READOUT_GAP]).toEqual([20, 14, 10]);
  });

  it("places LineChart's Oct 18 below: its highest dot 53px under the top of a 240px plot", () => {
    // Two series and the day: three lines, 84px with the edges and the gap, and only 53px above.
    const highest = (53 / 240) * 100;
    expect(placeReadout({ marks: [highest, 30], height: 240, lines: 3 })).toEqual({
      place: 'below',
      inset: 30,
    });
  });

  it('places it above the highest mark when the lines fit, its bottom that far from the plot bottom', () => {
    // 85% and 90% down a 240px plot: 204px above the higher.
    expect(placeReadout({ marks: [90, 85], height: 240, lines: 3 })).toEqual({ place: 'above', inset: 15 });
    // 20% down: 48px above in a 240px plot is too little for two lines, 120px in a 600px one is room.
    expect(placeReadout({ marks: [20], height: 240, lines: 2 })).toEqual({ place: 'below', inset: 20 });
    expect(placeReadout({ marks: [20], height: 600, lines: 2 })).toEqual({ place: 'above', inset: 80 });
  });

  it('places it on the side with more room when neither fits, above on a tie', () => {
    // A 100px plot: 84px fit neither 40px above nor 50px below, so below; 50 and 50, above.
    expect(placeReadout({ marks: [40, 50], height: 100, lines: 3 })).toEqual({ place: 'below', inset: 50 });
    expect(placeReadout({ marks: [50], height: 100, lines: 3 })).toEqual({ place: 'above', inset: 50 });
    expect(placeReadout({ marks: [60], height: 100, lines: 3 })).toEqual({ place: 'above', inset: 40 });
  });

  it('reads no marks as a mark at the top', () => {
    expect(placeReadout({ marks: [], height: 240, lines: 1 })).toEqual({ place: 'below', inset: 0 });
  });
});

describe('readoutAlign', () => {
  it('aligns to the start in the first quarter, the end in the last and the centre between', () => {
    expect([0, 24.9, 25, 50, 75, 75.1, 100].map(readoutAlign)).toEqual([
      'start',
      'start',
      'center',
      'center',
      'center',
      'end',
      'end',
    ]);
  });
});
