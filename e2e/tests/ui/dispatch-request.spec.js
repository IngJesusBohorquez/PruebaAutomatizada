import { test, expect } from '@playwright/test';
import { env } from '../../support/env.js';
import { uniqueReference } from '../../support/testData.js';

// Flujo elegido: login -> registrar una solicitud -> ver el resultado.
// Es el unico flujo que escribe datos (afecta disponibilidad real), por
// eso es el de mayor riesgo de negocio entre todos los flujos de la app.
//
// Control de datos: requestReference se genera de forma unica en cada
// ejecucion (uniqueReference) para que la prueba sea repetible sin
// depender de corridas anteriores.
//
// Sincronizacion: no se usan esperas fijas (sleep). Se usan locators con
// auto-espera y expect(...).toBeVisible()/toContainText() con polling.

test('un usuario autenticado registra una solicitud y ve el resultado', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('Usuario').fill(env.username);
  await page.getByLabel('Contraseña').fill(env.password);
  await page.getByRole('button', { name: 'Ingresar' }).click();

  await expect(page.getByRole('heading', { name: 'Nueva solicitud' })).toBeVisible();

  const reference = uniqueReference('REQ-UI');
  await page.getByLabel('Referencia').fill(reference);
  await page.getByLabel('Centro').fill(env.centerId);
  await page.getByLabel('Repuesto').fill(env.partCode);
  await page.getByLabel('Cantidad').fill('1');
  await page.getByLabel('Prioridad').selectOption('STANDARD');
  await page.getByRole('button', { name: 'Registrar' }).click();

  const result = page.getByTestId('dispatch-result');
  await expect(result, `no aparecio el resultado para la solicitud ${reference}`).toBeVisible();
  await expect(result).toContainText(reference);
  await expect(result).toContainText(/AUTHORIZED|REJECTED/);

  await expect(page.locator('li', { hasText: reference })).toBeVisible();
});