import { chromium } from '@playwright/test';

const ids = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce' });
page.on('console', (m) => {
  if (m.type() === 'error') console.log('console:', m.text().slice(0, 200));
});
for (const shape of ["square"]) {
  for (const [i, id] of ids.entries()) {
    if (i === 0) await page.goto(`http://127.0.0.1:6011/iframe.html?id=${id}&viewMode=story&globals=theme:light;shape:${shape};a11y.manual:!true`);
    else
      await page.evaluate((storyId) => {
        window.__STORYBOOK_ADDONS_CHANNEL__?.emit('setCurrentStory', { storyId, viewMode: 'story' });
      }, id);
    const start = Date.now();
    let phase;
    for (let t = 0; t < 100; t++) {
      phase = await page.evaluate((storyId) => {
        const r = window.__STORYBOOK_PREVIEW__?.currentRender;
        return r?.id === storyId ? r.phase : `other:${r?.id}:${r?.phase}`;
      }, id);
      if (phase === 'completed' || phase === 'finished' || phase === 'errored') break;
      await page.waitForTimeout(200);
    }
    console.log(shape, id, phase, Date.now() - start);
  }
}
await browser.close();
