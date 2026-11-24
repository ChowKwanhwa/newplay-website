import { test, expect } from '@playwright/test';

const paths = ['/', '/games/', '/lieflat/', '/classic/', '/jump/', '/2048/', '/fortune/', '/fortune/result/', '/studio/', '/newcoin/', '/nodes/', '/payment/', '/cooperation/', '/about/', '/information/'];

for (const width of [360, 390, 768, 1024, 1440]) {
  test.describe('viewport ' + width, () => {
    test.use({ viewport: { width, height: 950 }, reducedMotion: 'reduce' });

    for (const path of paths) {
      test('renders ' + path, async ({ page }) => {
        const problems: string[] = [];
        page.on('pageerror', error => problems.push(error.message));
        page.on('response', response => {
          if (response.url().startsWith('http://127.0.0.1:4383/') && response.status() >= 400) {
            problems.push(response.status() + ' ' + new URL(response.url()).pathname);
          }
        });
        const response = await page.goto(path);
        expect(response?.status()).toBe(200);
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator('h1').first()).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
        expect(problems).toEqual([]);
      });
    }
  });
}

test('unknown routes have a real 404 and a way home', async ({ page }) => {
  const response = await page.goto('/no-such-newplay-page/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('link', { name: '返回首页' })).toBeVisible();
});
