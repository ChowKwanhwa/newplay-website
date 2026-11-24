import { test, expect } from '@playwright/test';

test('home entrance runs on the first visit and navigation works immediately', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('#home-title')).toBeVisible();
  await expect(page.locator('#home-nav a[href="/games/"]')).toBeEnabled();
  expect(await page.evaluate(() => sessionStorage.getItem('newplay-home-intro'))).toBeTruthy();
  await page.locator('#home-nav a[href="/games/"]').click();
  await expect(page).toHaveURL(/\/games\/$/);
  await page.goto('/');
  await expect(page.locator('.home-hero')).not.toHaveAttribute('data-enter', '');
});

test('reduced motion presents the homepage in its finished state', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.home-hero')).not.toHaveAttribute('data-enter', '');
  await expect(page.locator('#home-title')).toContainText('数字娱乐');
});

test('Chinese titles render using the approved bundled faces', async ({ page, context }) => {
  const client = await context.newCDPSession(page);
  await client.send('DOM.enable');
  await client.send('CSS.enable');
  for (const [path, selector, family] of [
    ['/', '#home-title .marker', 'DouyinSans'],
    ['/lieflat/', 'h1', 'ZCOOL KuaiLe'],
  ]) {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    const { root } = await client.send('DOM.getDocument');
    const { nodeId } = await client.send('DOM.querySelector', {nodeId: root.nodeId, selector});
    const { fonts } = await client.send('CSS.getPlatformFontsForNode', {nodeId});
    expect(fonts.some(f => f.isCustomFont && f.familyName === family)).toBe(true);
  }
});

test('the node quiz leads to a cancellable demo checkout', async ({ page }) => {
  await page.goto('/nodes/');
  await page.locator('[data-answer="0"]').click();
  await expect(page.locator('dialog[open]')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.locator('[data-answer="2"]').click();
  await page.locator('[data-answer="2"]').click();
  await expect(page.locator('[data-checkout]')).toBeDisabled();
  await page.locator('[data-agree]').check();
  await page.locator('[data-checkout]').click();
  await expect(page).toHaveURL(/\/payment\/$/);
  await page.locator('input[value="stable"]').check();
  await page.locator('[data-pay]').click();
  await expect(page.locator('[data-preview]')).toBeVisible();
  await page.locator('[data-cancel]').click();
  await page.getByRole('button', {name: '确认取消'}).click();
  await expect(page.locator('[data-preview]')).toBeHidden();
});

test('game catalog search can reach an empty state and recover', async ({ page }) => {
  await page.goto('/games/');
  const search = page.getByRole('searchbox');
  await search.fill('not-a-newplay-game');
  await expect(page.locator('#empty-games')).toBeVisible();
  await search.fill('2048');
  await expect(page.locator('[data-game]:visible')).toHaveCount(1);
  await page.locator('[data-game]:visible').click();
  await expect(page).toHaveURL(/\/2048\/$/);
});
