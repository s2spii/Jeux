import { test, expect } from '@playwright/test';

test.describe('Ludoteca — parcours critiques', () => {
  test('la page d’accueil présente les trois jeux', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Ludoteca', exact: true })).toBeVisible();
    await expect(page.getByText('Le Cabinet des Énigmes')).toBeVisible();
    await expect(page.getByText('Petit Bac')).toBeVisible();
    await expect(page.getByText('Chambre des Paradoxes')).toBeVisible();
  });

  test('jouer en invité puis lancer une manche de Petit Bac', async ({ page }) => {
    await page.goto('/connexion');
    await page.getByRole('button', { name: /Jouer en invité/i }).click();
    await expect(page).toHaveURL('/');

    await page.goto('/jeux/petit-bac');
    await page.getByRole('button', { name: /Lancer la manche/i }).click();
    await expect(page.getByRole('button', { name: /Stop/i })).toBeVisible();
    await page.getByRole('button', { name: /Stop/i }).click();
    await expect(page.getByText(/Manche terminée/i)).toBeVisible();
  });

  test('résoudre une enquête de campagne', async ({ page }) => {
    await page.goto('/jeux/enquete');
    await page.getByRole('button', { name: /Enquêter/i }).first().click();
    await expect(page.getByText(/Faits établis/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Accuser/i })).toBeVisible();
  });

  test('le thème clair/sombre se bascule', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await page.getByRole('button', { name: /thème clair/i }).click();
    await expect(html).toHaveAttribute('data-theme', 'light');
  });

  test('le défi du jour des Paradoxes se lance', async ({ page }) => {
    await page.goto('/jeux/paradoxes');
    const dailyCard = page.locator('.card-hover', { hasText: 'Défi du jour' });
    await dailyCard.getByRole('button', { name: /^Jouer$/i }).click();
    await expect(page.getByText(/🎯 Cible/)).toBeVisible();
  });
});
