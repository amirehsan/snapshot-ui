import { beforeEach } from 'vitest';
import { userEvent } from 'vitest/browser';

// The story tests share one browser, so the real pointer stays wherever the last
// test left it, and a component drawn under it starts hovered. A play that reads a
// resting look (an edge, a fill) then reads the hover look instead. Before every
// story, rest the pointer on a 2px pad fixed in the viewport's corner, above every
// layer, so whatever a story draws, nothing of it is under the pointer.
const PAD_ID = 'story-test-pointer-pad';

beforeEach(async () => {
  let pad = document.getElementById(PAD_ID);
  if (!pad) {
    pad = document.createElement('div');
    pad.id = PAD_ID;
    pad.setAttribute('aria-hidden', 'true');
    pad.style.cssText = 'position:fixed;right:0;bottom:0;width:2px;height:2px;z-index:2147483647;';
    document.body.append(pad);
  }
  await userEvent.hover(pad, { force: true });
});
