import { expect, test, type Page } from '@playwright/test';

/** Books the first free slot of the first bookable day and returns once the confirmation is shown. */
async function bookFirstSlot(page: Page, clinic = 'aus-01') {
  await page.goto(`/clinic/${clinic}/`);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('.times button').first().waitFor();
  await page.locator('.times button').first().click();
  await page.getByRole('button', { name: /Continue —/ }).click();
  await page.getByPlaceholder('Jane Smith').fill('E2E Tester');
  await page.getByPlaceholder('jane@example.com').fill('e2e@example.com');
  await page.getByPlaceholder('(512) 555-0142').fill('5125550142');
  await page.getByRole('button', { name: 'Continue to deposit' }).click();
  await page.getByRole('button', { name: /Pay \$25/ }).click();
  await expect(page.locator('.confirmed')).toBeVisible();
}

test('home page search leads to filtered results', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Find a dentist');
  await page.getByRole('button', { name: 'Location' }).click();
  await page.getByRole('option', { name: 'Denver, CO' }).click();
  await page.getByRole('button', { name: 'Find a dentist' }).click();
  await expect(page).toHaveURL(/\/search\/\?city=denver/);
  await expect(page.locator('h1')).toContainText('Denver, CO');
});

test('custom dropdown works with the keyboard', async ({ page }) => {
  await page.goto('/search/');
  const sort = page.getByRole('button', { name: 'Sort by' });
  await sort.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(sort).toContainText('Soonest available');
  await sort.click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.sel-menu')).toHaveCount(0);
});

test('clicking a card selects the clinic on the map', async ({ page }) => {
  await page.goto('/search/');
  const card = page.locator('.card-clinic').nth(3);
  await card.locator('.meta').click();
  await expect(card).toHaveClass(/sel/);
  await expect(page.locator('.pin.active')).toHaveCount(1, { timeout: 20_000 });
  await expect(page.locator('.maplibregl-popup')).toContainText(await card.locator('.name').innerText());
});

test('save and compare clinics', async ({ page }) => {
  await page.goto('/search/');
  await page.locator('.heart').first().click();
  await expect(page.getByRole('button', { name: /Saved · 1/ })).toBeVisible();
  await page.locator('.cmp input').nth(0).check();
  await page.locator('.cmp input').nth(1).check();
  await page.getByRole('link', { name: 'Compare' }).click();
  await expect(page.getByRole('heading', { name: 'Compare clinics' })).toBeVisible();
  await expect(page.locator('.cmp-head')).toHaveCount(2);
});

test('booking appears in My bookings and cancelling removes it', async ({ page }) => {
  await bookFirstSlot(page);
  await page.goto('/my-bookings/');
  await expect(page.locator('.booking-row')).toHaveCount(1);
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { name: 'Cancel booking' }).click();
  await expect(page.getByText('No bookings yet.')).toBeVisible();
});

test('a booked slot is no longer offered', async ({ page }) => {
  await bookFirstSlot(page);
  const booked = await page.evaluate(() => JSON.parse(localStorage.getItem('brightsmile.bookings')!)[0] as { day: string; time: string });
  // the same slot, requested again through a link, must be refused
  await page.goto(`/clinic/aus-01/?service=cleaning&day=${booked.day}&time=${encodeURIComponent(booked.time)}`);
  await expect(page.locator('.notice[role=alert]')).toContainText('no longer available');
  await expect(page.locator('.times button.on')).toHaveCount(0);
});

test('booking form validates input', async ({ page }) => {
  await page.goto('/clinic/aus-01/');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('.times button').first().click();
  await page.getByRole('button', { name: /Continue —/ }).click();
  await page.getByRole('button', { name: 'Continue to deposit' }).click();
  await expect(page.locator('.err')).toHaveCount(3);
  await page.getByPlaceholder('Jane Smith').fill('Jo');
  await expect(page.locator('.err')).toHaveCount(2);
});

test('clinic admin: week view and new appointment feedback', async ({ page }) => {
  await page.goto('/admin/');
  await page.getByRole('button', { name: 'Week', exact: true }).click();
  await expect(page.locator('.week-col')).toHaveCount(6);
  await page.getByRole('button', { name: 'Day', exact: true }).click();
  await page.getByRole('button', { name: '+ New appointment' }).click();
  await page.getByPlaceholder('Jane Smith').fill('Zed Test');
  await page.locator('input[type=tel]').fill('5125550199');
  await page.getByRole('button', { name: 'Add appointment' }).click();
  // the default date is today, so either it is saved or a clear validation / clash message is shown
  await expect(page.locator('.toast, .modal .err').first()).toBeVisible();
});

test('platform admin: add a clinic', async ({ page }) => {
  await page.goto('/admin/platform/');
  await page.getByRole('button', { name: '+ Add clinic' }).click();
  await page.getByRole('button', { name: 'Add clinic', exact: true }).click();
  await expect(page.locator('.modal .err')).toHaveText('Enter the clinic name');
  await page.getByPlaceholder('Sunrise Family Dental').fill('Sunrise Family Dental');
  await page.locator('.modal').getByRole('button', { name: 'Add clinic' }).click();
  await expect(page.locator('.dt-row.c-cols').nth(1)).toContainText('Sunrise Family Dental');
});

test('static pages render and unknown routes show the 404 page', async ({ page }) => {
  const pages = [
    ['/for-clinics/', 'More patients booked'],
    ['/dentists/austin/cleaning/', 'Teeth cleaning in Austin'],
    ['/privacy/', 'Privacy policy'],
    ['/clinic/aus-01/dentist/d0/', 'Dr. Emily Carter'],
  ] as const;
  for (const [url, h1] of pages) {
    await page.goto(url);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(h1);
  }
  const res = await page.goto('/nope/');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: /find that page/ })).toBeVisible();
});

test('a link to a slot that is not bookable is rejected, not trusted', async ({ page }) => {
  await page.goto('/clinic/aus-01/?service=cleaning&day=2020-01-01&time=3%3A00%20AM');
  await expect(page.locator('.notice[role=alert]')).toContainText('no longer available');
  await expect(page.locator('.times button.on')).toHaveCount(0);
});

test('rescheduling keeps the old slot selectable and a fake reschedule id is ignored', async ({ page }) => {
  await bookFirstSlot(page);
  const id = (await page.locator('.confirmed .muted').innerText()).match(/BK-\w+/)![0];
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('brightsmile.bookings')!)[0] as { day: string; time: string });
  await page.goto(`/clinic/aus-01/?service=cleaning&reschedule=${id}&day=${stored.day}&time=${encodeURIComponent(stored.time)}`);
  await expect(page.locator('.notice').first()).toContainText('rescheduling');
  await expect(page.locator('.times button.on')).toHaveText(stored.time); // its own slot is still free
  await page.goto('/clinic/aus-01/?reschedule=BK-FAKE00');
  await expect(page.getByText('You are rescheduling')).toHaveCount(0);
});
