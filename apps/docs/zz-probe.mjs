import { chromium } from '@playwright/test';

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
const page = await browser.newPage();
page.on('console', (message) => console.log('console', message.type(), message.text().slice(0, 400)));
page.on('pageerror', (error) => console.log('pageerror', error.message.slice(0, 600)));
await page.goto('http://127.0.0.1:3763/docs/components/choice-cards');
await page.waitForTimeout(3000);
console.log('checked', await page.locator('.header input[type="radio"]:checked').count());
await browser.close();
