import { test, expect } from '@playwright/test';

/**
 * Production smoke: Next shell loads without backend services, and public lead
 * forms submit against mocked API routes so the marketing funnel stays covered.
 */
async function stubPublicApis(page: import('@playwright/test').Page) {
  const leads: unknown[] = [];

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (request.method() === 'POST' && path === '/api/public/leads') {
      leads.push(request.postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, id: 'test-lead-id', message: 'ok' }),
      });
      return;
    }

    if (request.method() === 'POST' && path === '/api/debug-log') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      return;
    }

    if (request.method() === 'GET') {
      if (path === '/api/courses/active') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'course-starters',
              code: 'STARTERS',
              name: 'LERA Starters',
              nameVi: 'LERA Starters',
              category: 'ENGLISH',
              ageFrom: 2.5,
              ageTo: 4,
              isActive: true,
            },
          ]),
        });
        return;
      }

      if (
        path.startsWith('/api/website-settings') ||
        path.startsWith('/api/cms-settings') ||
        path === '/api/centers' ||
        path.startsWith('/api/testimonials') ||
        path.startsWith('/api/faqs') ||
        path.startsWith('/api/blog')
      ) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: path === '/api/centers' || path.startsWith('/api/testimonials') || path.startsWith('/api/faqs') || path.startsWith('/api/blog')
            ? '[]'
            : '{}',
        });
        return;
      }
    }

    await route.continue();
  });

  return leads;
}

function fillableControls(scope: import('@playwright/test').Locator) {
  return scope.locator('input:not([name="website"]):not([type="checkbox"]):not([type="radio"]), textarea');
}

test.describe('smoke', () => {
  test('home page responds', async ({ page }) => {
    await stubPublicApis(page);
    const res = await page.goto('/');
    expect(res?.ok()).toBeTruthy();
  });

  test('login page responds', async ({ page }) => {
    await stubPublicApis(page);
    const res = await page.goto('/auth/login');
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('body')).toBeVisible();
  });

  test('home page lead form submits', async ({ page }) => {
    const leads = await stubPublicApis(page);
    await page.goto('/');

    const form = page.locator('form').first();
    const fields = fillableControls(form);
    await fields.nth(0).fill('Test Parent');
    await fields.nth(1).fill('0901234567');
    await form.locator('select').nth(0).selectOption({ index: 1 });
    await form.locator('select').nth(1).selectOption({ index: 1 });
    await form.locator('input[type="checkbox"]').check();
    await form.locator('button[type="submit"]').click();

    await expect.poll(() => leads.length).toBe(1);
    await expect(form).toBeHidden();
    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({ parentName: 'Test Parent', website: '' });
  });

  test('book trial form submits', async ({ page }) => {
    const leads = await stubPublicApis(page);
    await page.goto('/book-trial');

    const fields = page.locator('form input:not([name="website"])');
    await fields.nth(0).fill('Trial Parent');
    await fields.nth(1).fill('0901234568');
    await fields.nth(2).fill('trial@example.com');
    await fields.nth(3).fill('Trial Student');
    await fields.nth(4).fill('8');
    await fields.nth(5).fill('Weekday evenings');
    const form = page.locator('form').first();
    await form.locator('button[type="submit"]').click();

    await expect.poll(() => leads.length).toBe(1);
    await expect(form).toBeHidden();
    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({ parentName: 'Trial Parent', website: '' });
  });

  test('placement result submits', async ({ page }) => {
    const leads = await stubPublicApis(page);
    await page.goto('/placement');

    for (let i = 0; i < 4; i += 1) {
      await page.locator('input[type="radio"]').nth(2).check();
      await page.locator('main button:not([disabled])').last().click();
    }

    const fields = page.locator('main input:not([name="website"]):not([type="radio"])');
    await fields.nth(0).fill('Placement Parent');
    await fields.nth(1).fill('0901234569');
    await fields.nth(2).fill('placement@example.com');
    await page.locator('main button:not([disabled])').last().click();

    await expect.poll(() => leads.length).toBe(1);
    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({
      parentName: 'Placement Parent',
      placementScoreOutOf16: 8,
      website: '',
    });
  });

  test('contact form submits', async ({ page }) => {
    const leads = await stubPublicApis(page);
    await page.goto('/contact');

    const form = page.locator('form').first();
    const fields = fillableControls(form);
    await fields.nth(0).fill('Contact Parent');
    await fields.nth(1).fill('contact@example.com');
    await fields.nth(2).fill('Course enquiry');
    await fields.nth(3).fill('Please contact me about classes.');
    await form.locator('button[type="submit"]').click();

    await expect.poll(() => leads.length).toBe(1);
    await expect(form).toBeHidden();
    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({ parentName: 'Contact Parent', website: '' });
  });

  test('course detail registration submits', async ({ page }) => {
    const leads = await stubPublicApis(page);
    await page.goto('/courses/lera-starters');

    const form = page.locator('form').first();
    const fields = fillableControls(form);
    await fields.nth(0).fill('Course Parent');
    await fields.nth(1).fill('0901234570');
    await fields.nth(2).fill('course@example.com');
    await fields.nth(3).fill('Course Student');
    await fields.nth(4).fill('6');
    await form.locator('button[type="submit"]').click();

    await expect.poll(() => leads.length).toBe(1);
    await expect(form).toBeHidden();
    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({ parentName: 'Course Parent', website: '' });
  });
});
