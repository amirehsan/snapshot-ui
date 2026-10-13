import { devices, expect, test, type Locator, type Page } from '@playwright/test';
import { ready } from './ready';

/** A story's URL with the toolbar globals given as Storybook writes them, `theme:light;shape:rounded`. */
const story = (id: string, globals: string) => `/iframe.html?id=${id}&viewMode=story&globals=${globals}`;

test('a light card inside a dark page takes the light ink and the page keeps the dark canvas', async ({
  page,
}) => {
  await page.goto(story('components-button--nested-themes', 'theme:light;shape:rounded'));
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
    await page.goto(story('components-button--primary', `theme:light;shape:${shape}`));
    await ready(page);
    await expect(page.getByRole('button', { name: 'Save changes' })).toHaveCSS(
      'border-top-left-radius',
      radius,
    );
  });
}

const DENSITY = 'checks-density--default';

interface Heights {
  button: number;
  iconButton: number;
  field: number;
  md: number;
  sm: number;
  card: string;
}

/** The height each part of the density story draws, and the card's padding. */
const heights = async (page: Page): Promise<Heights> => {
  const height = async (locator: Locator): Promise<number> => {
    const box = await locator.boundingBox();
    if (!box) throw new Error('The part is not drawn');
    return box.height;
  };
  return {
    button: await height(page.getByTestId('button')),
    iconButton: await height(page.getByTestId('icon-button')),
    // The field and the segmented controls carry a label row: what density sizes is the control under it.
    field: await height(page.getByTestId('field').locator('.input')),
    md: await height(page.getByTestId('md').locator('.segmented-track')),
    sm: await height(page.getByTestId('sm').locator('.segmented-track')),
    card: await page.getByTestId('card').evaluate((card) => getComputedStyle(card).paddingTop),
  };
};

const COMFORTABLE: Heights = { button: 40, iconButton: 40, field: 48, md: 48, sm: 40, card: '32px' };

test('compact density draws 36px controls and 20px card padding with a mouse', async ({ page }) => {
  await page.goto(story(DENSITY, 'theme:light;shape:rounded;density:compact'));
  await ready(page);
  await expect(page.locator('html')).toHaveAttribute('data-density', 'compact');
  expect(await heights(page)).toEqual({
    button: 36,
    iconButton: 36,
    field: 36,
    md: 36,
    sm: 36,
    card: '20px',
  });
});

test('comfortable stays at 40, 48 and 32 with no density set', async ({ page }) => {
  await page.goto(story(DENSITY, 'theme:light;shape:rounded'));
  await ready(page);
  expect(await heights(page)).toEqual(COMFORTABLE);
});

// The Pixel 7 descriptor less defaultBrowserType, a worker option a describe group cannot set. The project is
// Chromium already, the engine the descriptor names.
const { userAgent, viewport, deviceScaleFactor, isMobile, hasTouch } = devices['Pixel 7'];

test.describe('on a touch screen', () => {
  test.use({ userAgent, viewport, deviceScaleFactor, isMobile, hasTouch });

  test('compact grows to 44px and comfortable does not', async ({ page }) => {
    await page.goto(story(DENSITY, 'theme:light;shape:rounded;density:compact'));
    await ready(page);
    // An emulation that reported a fine pointer would pass the check below with nothing grown, so it fails here.
    expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
    await expect(page.locator('html')).toHaveAttribute('data-density', 'compact');
    expect(await heights(page)).toEqual({
      button: 44,
      iconButton: 44,
      field: 44,
      md: 44,
      sm: 44,
      card: '20px',
    });
    await page.goto(story(DENSITY, 'theme:light;shape:rounded'));
    await ready(page);
    expect(await heights(page)).toEqual(COMFORTABLE);
  });
});
