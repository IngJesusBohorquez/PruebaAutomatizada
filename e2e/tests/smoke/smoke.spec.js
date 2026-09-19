import { test, expect } from '@playwright/test';
import { env } from '../../support/env.js';
import { uniqueReference } from '../../support/testData.js';

// Suite de humo: responde rapido a "el entorno desplegado localmente
// esta en condiciones minimas para seguir probando?". A diferencia de
// tests/ui, aqui NO se evaluan reglas de negocio en detalle: solo se
// confirma que el servicio, la web, y una operacion critica responden.

test.describe('humo', () => {
  test('el backend responde disponible en /health', async ({ request }) => {
    const res = await request.get(`${env.apiBaseUrl}/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('UP');
  });

  test('la aplicacion web carga y muestra la pantalla de acceso', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Solicitudes de despacho' })).toBeVisible();
    await expect(page.getByLabel('Usuario')).toBeVisible();
  });

  test('operacion critica representativa: login y registro de una solicitud', async ({ request }) => {
    const loginRes = await request.post(`${env.apiBaseUrl}/api/session`, {
      data: { username: env.username, password: env.password }
    });
    expect(loginRes.status()).toBe(200);
    const { accessToken } = await loginRes.json();
    expect(accessToken).toBeTruthy();

    const reference = uniqueReference('REQ-SMOKE');
    const dispatchRes = await request.post(`${env.apiBaseUrl}/api/dispatch-requests`, {
      headers: { authorization: `Bearer ${accessToken}` },
      data: {
        requestReference: reference,
        centerId: env.centerId,
        partCode: env.partCode,
        quantity: 1,
        priority: 'STANDARD'
      }
    });
    expect(dispatchRes.status()).toBe(201);
    const body = await dispatchRes.json();
    expect(body.status).toMatch(/AUTHORIZED|REJECTED/);
  });
});