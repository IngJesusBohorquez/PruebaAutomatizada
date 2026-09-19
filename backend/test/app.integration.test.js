import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

const credentials = { username: 'integration-user', password: 'integration-pass' };

async function startServer() {
  const app = createApp({ username: credentials.username, password: credentials.password });
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

async function login(baseUrl) {
  const res = await fetch(`${baseUrl}/api/session`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  const body = await res.json();
  return body.accessToken;
}

test('flujo completo: login -> crear solicitud -> consultarla por referencia', async () => {
  const { server, baseUrl } = await startServer();
  try {
    const token = await login(baseUrl);
    assert.ok(token);

    const reference = `REQ-INT-${Date.now()}`;
    const createRes = await fetch(`${baseUrl}/api/dispatch-requests`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({
        requestReference: reference,
        centerId: 'CENTER-001',
        partCode: 'PART-BRAKE-01',
        quantity: 2,
        priority: 'STANDARD'
      })
    });
    assert.equal(createRes.status, 201);
    const created = await createRes.json();
    assert.equal(created.status, 'AUTHORIZED');

    const getRes = await fetch(`${baseUrl}/api/dispatch-requests/${reference}`, {
      headers: { authorization: `Bearer ${token}` }
    });
    assert.equal(getRes.status, 200);
    const fetched = await getRes.json();
    assert.equal(fetched.requestReference, reference);
  } finally {
    server.close();
  }
});

test('R4: rutas protegidas responden 401 sin token', async () => {
  const { server, baseUrl } = await startServer();
  try {
    const res = await fetch(`${baseUrl}/api/dispatch-requests`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ requestReference: 'REQ-NOAUTH' })
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.deepEqual(body, { error: 'unauthorized' });
  } finally {
    server.close();
  }
});

test('login con credenciales invalidas responde 401 sin filtrar la credencial esperada', async () => {
  const { server, baseUrl } = await startServer();
  try {
    const res = await fetch(`${baseUrl}/api/session`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'quien-sea', password: 'incorrecta' })
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.deepEqual(body, { error: 'invalid_credentials' });
  } finally {
    server.close();
  }
});

test('R3: un JSON malformado responde 400 controlado, no 500 con stack', async () => {
  const { server, baseUrl } = await startServer();
  try {
    const token = await login(baseUrl);
    const res = await fetch(`${baseUrl}/api/dispatch-requests`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: '{ esto no es json valido'
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, 'invalid_json');
  } finally {
    server.close();
  }
});