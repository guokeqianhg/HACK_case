import { test, expect } from '@playwright/test';

const BASE = process.env.SUT_URL || 'http://127.0.0.1:3000';

test.beforeEach(async ({ page, request }) => {
  await request.post(`${BASE}/api/test/reset`).catch(() => {});
  await page.goto(BASE);
});

test('首页展示 4 辆待出场车辆与预计费用', async ({ page }) => {
  const list = page.getByTestId('ticket-list');
  await expect(list.locator('.ticket-item')).toHaveCount(4);
  await expect(list).toContainText('粤A1001');
  await expect(list).toContainText('¥12.00');
});

test('点击出场结算后返回收费结果并移除车辆', async ({ page }) => {
  await page.getByTestId('checkout-T1001').click();
  const result = page.getByTestId('result');
  await expect(result).toContainText('粤A1001');
  await expect(result).toContainText('实收 ¥12.00');
  await expect(page.getByTestId('ticket-list')).not.toContainText('粤A1001');
});

test('高峰放行估算可返回车辆数与耗时摘要', async ({ page }) => {
  await page.getByTestId('batch-count').fill('120');
  await page.getByTestId('estimate-btn').click();
  await expect(page.getByTestId('batch-result')).toContainText('120 辆车已完成估算');
  await expect(page.getByTestId('batch-result')).toContainText('接口耗时');
});
