import { expect, test, type Page } from '@playwright/test';

const raceUrlPattern = /\/race\/\d{8}_\d{6}/;

async function waitForHome(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { name: 'Horse Racing Game' })).toBeVisible();
}

async function startNewGame(page: Page): Promise<string> {
  await page.getByRole('button', { name: 'NEW GAME' }).click();
  await expect(page).toHaveURL(raceUrlPattern);
  await expect(page.getByRole('button', { name: 'START' })).toBeVisible();
  return getRaceIdFromUrl(page.url());
}

async function goBackToHomeFromRace(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'BACK' }).click();
  await expect(page).toHaveURL('/');
  await waitForHome(page);
}

function getRaceIdFromUrl(url: string): string {
  const match = url.match(/\/race\/([^/?#]+)/);
  if (!match) {
    throw new Error(`Cannot extract race id from URL: ${url}`);
  }
  return match[1];
}

async function seedCompletedRaceFromActiveRace(page: Page, raceId: string): Promise<void> {
  await expect
    .poll(async () => {
      return page.evaluate(() => Boolean(localStorage.getItem('horse-racing:active-race')));
    })
    .toBe(true);

  await page.evaluate(async (id) => {
    const activeRaceRaw = localStorage.getItem('horse-racing:active-race');
    if (!activeRaceRaw) {
      throw new Error('Missing active race snapshot in localStorage.');
    }

    const activeRace = JSON.parse(activeRaceRaw) as {
      id: string;
      status: string;
      activeRoundId: string | null;
      activeRoundStatus: string | null;
      runtime: unknown;
      updatedAtMs: number;
      rounds: Array<Record<string, unknown>>;
    };

    if (activeRace.id !== id) {
      throw new Error(`Expected active race id "${id}", got "${activeRace.id}".`);
    }

    const completedRace = {
      ...activeRace,
      status: 'completed',
      activeRoundId: null,
      activeRoundStatus: null,
      runtime: null,
      updatedAtMs: Date.now(),
      rounds: activeRace.rounds.map((round) => ({
        ...round,
        status: 'completed',
      })),
    };

    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('horse-racing:db', 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('completed-races')) {
          db.createObjectStore('completed-races', { keyPath: 'id' });
        }
      };

      request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB.'));

      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('completed-races', 'readwrite');
        const store = tx.objectStore('completed-races');

        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error ?? new Error('Failed to save completed race.'));

        store.put(completedRace);
      };
    });
  }, raceId);
}

test.describe('horse racing game flow', () => {
  test('menu keyboard navigation loops through enabled buttons', async ({ page }) => {
    await page.goto('/');
    await waitForHome(page);

    const newGameButton = page.getByRole('button', { name: 'NEW GAME' });
    const resultsButton = page.getByRole('button', { name: 'RESULTS' });
    const aboutButton = page.getByRole('button', { name: 'ABOUT' });

    await expect(newGameButton).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await expect(resultsButton).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await expect(aboutButton).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await expect(newGameButton).toBeFocused();

    await page.keyboard.press('ArrowUp');
    await expect(aboutButton).toBeFocused();
  });

  test('can start a race and pause/resume round with reload persistence', async ({ page }) => {
    await page.goto('/');
    await waitForHome(page);

    await startNewGame(page);

    const startButton = page.getByRole('button', { name: 'START' });
    await expect(startButton).toBeVisible();

    await page.keyboard.press('Enter');

    const pauseButton = page.getByRole('button', { name: 'PAUSE' });
    await expect(pauseButton).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'RESUME' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('button', { name: 'RESUME' })).toBeVisible();

    await page.getByRole('button', { name: 'RESUME' }).click();
    await expect(page.getByRole('button', { name: 'PAUSE' })).toBeVisible();
  });

  test('continue button reflects active race state and opens existing race', async ({ page }) => {
    await page.goto('/');
    await waitForHome(page);

    const continueButton = page.getByRole('button', { name: 'CONTINUE' });
    await expect(continueButton).toBeDisabled();

    const raceId = await startNewGame(page);
    await goBackToHomeFromRace(page);

    await expect(continueButton).toBeEnabled();
    await continueButton.click();

    await expect(page).toHaveURL(new RegExp(`/race/${raceId}$`));
  });

  test('new game confirmation dialog supports cancel and confirm paths', async ({ page }) => {
    await page.goto('/');
    await waitForHome(page);

    const firstRaceId = await startNewGame(page);
    await goBackToHomeFromRace(page);

    await page.getByRole('button', { name: 'NEW GAME' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Start new game?')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();

    await page.getByRole('button', { name: 'CONTINUE' }).click();
    await expect(page).toHaveURL(new RegExp(`/race/${firstRaceId}$`));

    await goBackToHomeFromRace(page);
    await page.getByRole('button', { name: 'NEW GAME' }).click();
    await page.getByRole('button', { name: 'Yes, start new game' }).click();
    await expect(page).toHaveURL(raceUrlPattern);

    const secondRaceId = getRaceIdFromUrl(page.url());
    expect(secondRaceId).not.toBe(firstRaceId);
  });

  test('can navigate to results and about screens from home menu', async ({ page }) => {
    await page.goto('/');
    await waitForHome(page);

    await page.getByRole('button', { name: 'RESULTS' }).click();
    await expect(page).toHaveURL('/results');
    await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible();
    await expect(page.getByText('No completed races yet.')).toBeVisible();
    await page.getByRole('button', { name: 'Back to menu' }).click();
    await waitForHome(page);

    await page.getByRole('button', { name: 'ABOUT' }).click();
    await expect(page).toHaveURL('/about');
    await expect(page.getByRole('heading', { name: 'About Horse Racing Game' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Rules' })).toBeVisible();
    await page.getByRole('button', { name: 'Back' }).click();
    await waitForHome(page);
  });

  test('completed race appears in results list and opens in read-only mode', async ({ page }) => {
    await page.goto('/');
    await waitForHome(page);

    const raceId = await startNewGame(page);
    await seedCompletedRaceFromActiveRace(page, raceId);

    await page.goto('/results');
    await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible();
    await expect(page.getByRole('button', { name: raceId })).toBeVisible();

    await page.getByRole('button', { name: raceId }).click();
    await expect(page).toHaveURL(new RegExp(`/results/${raceId}$`));
    await expect(page.getByText('Completed')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Back to results' }).first()).toBeVisible();

    await page.getByRole('button', { name: 'Back to results' }).first().click();
    await expect(page).toHaveURL('/results');
  });
});
