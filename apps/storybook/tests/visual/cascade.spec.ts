import { expect, test } from '@playwright/test';
import { ready } from './ready';

const story = (id: string, theme: string, shape: string) =>
  `/iframe.html?id=${id}&viewMode=story&globals=theme:${theme};shape:${shape}`;

test('a light card inside a dark page takes the light ink and the page keeps the dark canvas', async ({
  page,
}) => {
  await page.goto(story('components-button--nested-themes', 'light', 'rounded'));
  await ready(page);
  const text = page.getByTestId('nested-text');
  await expect(text).toHaveCSS('color', 'rgb(20, 20, 19)');
  const dark = page.locator('[data-theme="dark"]').first();
  await expect(dark).toHaveCSS('background-color', 'rgb(14, 14, 13)');
});

for (const [shape, radius] of [
  ['rounded', '20px'],
  ['soft', '10px'],
  ['square', '0px'],
] as const) {
  test(`a button takes the ${shape} control radius`, async ({ page }) => {
    await page.goto(story('components-button--primary', 'light', shape));
    await ready(page);
    await expect(page.getByRole('button', { name: 'Save changes' })).toHaveCSS(
      'border-top-left-radius',
      radius,
    );
  });
}
