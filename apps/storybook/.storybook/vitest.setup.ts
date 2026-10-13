import { beforeEach } from 'vitest';
import { userEvent } from 'vitest/browser';

// The story tests share one browser, so the real pointer stays wherever the last
// test left it, and a component drawn under it starts hovered. A play that reads a
// resting look (an edge, a fill) then reads the hover look instead. Park the pointer
// in the page's top-left corner, inside the canvas padding, before every story.
beforeEach(async () => {
  await userEvent.hover(document.documentElement, { position: { x: 0, y: 0 }, force: true });
});
