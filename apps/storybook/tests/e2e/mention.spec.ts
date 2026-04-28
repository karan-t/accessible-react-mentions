import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const STORY = '/iframe.html?id=mention-basic--default&viewMode=story';

test.describe('Mention/Basic', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(STORY);
    await expect(page.getByRole('combobox', { name: 'Message' })).toBeVisible();
  });

  test('renders combobox with correct ARIA', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'Message' });
    await expect(input).toHaveAttribute('aria-autocomplete', 'list');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(input).toHaveAttribute('aria-haspopup', 'listbox');
  });

  test('opens listbox on @, ArrowDown moves highlight, Enter inserts token, Escape closes', async ({
    page,
  }) => {
    const input = page.getByRole('combobox', { name: 'Message' });
    await input.click();
    await page.keyboard.press('@');

    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();
    await expect(input).toHaveAttribute('aria-expanded', 'true');

    await expect(page.getByRole('status')).toContainText(
      /suggestions available\. .* highlighted\./,
    );

    await page.keyboard.press('ArrowDown');
    const activeId = await input.getAttribute('aria-activedescendant');
    expect(activeId).toBeTruthy();
    const activeOption = page.locator(`#${activeId}`);
    await expect(activeOption).toHaveAttribute('aria-selected', 'true');

    await page.keyboard.press('Enter');
    await expect(listbox).toBeHidden();
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    const value = await input.inputValue();
    expect(value).toMatch(/^@\[[^\]]+\]\(item:\d+\)\s$/);

    await input.pressSequentially('hi @lin');
    await expect(listbox).toBeVisible();
    await expect(page.getByRole('option')).toHaveCount(1);

    await page.keyboard.press('Escape');
    await expect(listbox).toBeHidden();
  });

  test('focusing the textarea does not open the listbox (SC 3.2.1)', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'Message' });
    await input.focus();
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('listbox')).toBeHidden();
  });

  test('typing non-trigger text does not change context (SC 3.2.2)', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'Message' });
    await input.click();
    await input.pressSequentially('hello world');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('listbox')).toBeHidden();
  });

  test('Tab moves focus out when no item is highlighted (SC 2.1.2 — no keyboard trap)', async ({
    page,
  }) => {
    const input = page.getByRole('combobox', { name: 'Message' });
    await input.click();
    await input.pressSequentially('@zzznomatch');
    await expect(page.getByRole('listbox')).toBeHidden();
    await page.keyboard.press('Tab');
    await expect(input).not.toBeFocused();
  });

  test('inserted token round-trips through the value (SC 3.3.7 — redundant entry)', async ({
    page,
  }) => {
    const input = page.getByRole('combobox', { name: 'Message' });
    await input.click();
    await page.keyboard.press('@');
    await page.keyboard.press('Enter');
    const value = await input.inputValue();
    expect(value).toMatch(/^@\[Ada Lovelace\]\(item:1\)\s$/);
  });

  test('zero WCAG 2.2 AA violations (axe)', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Message' }).click();
    await page.keyboard.press('@');
    await expect(page.getByRole('listbox')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
