import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import App from '../src/App.vue';

function jsonResponse(body, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body)
  });
}

describe('App.vue - flujo de login y registro de solicitud', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('permite iniciar sesion y registrar una solicitud, mostrando el resultado', async () => {
    const fetchMock = vi.fn((url, options = {}) => {
      if (url.endsWith('/api/session')) {
        return jsonResponse({ accessToken: 'token-de-prueba' });
      }
      if (url.endsWith('/api/dispatch-requests') && options.method === 'POST') {
        return jsonResponse(
          { requestReference: 'REQ-UI-001', status: 'AUTHORIZED', reason: null, notes: null },
          201
        );
      }
      if (url.endsWith('/api/dispatch-requests')) {
        return jsonResponse({ items: [] });
      }
      throw new Error(`URL no esperada en el mock: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const wrapper = mount(App);

    const loginInputs = wrapper.findAll('input');
    await loginInputs[0].setValue('candidate');
    await loginInputs[1].setValue('cualquier-password-local');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(wrapper.get('h2').text()).toBe('Nueva solicitud');

    const dispatchForm = wrapper.find('form');
    const fields = dispatchForm.findAll('input, textarea, select');
    await fields[0].setValue('REQ-UI-001'); // Referencia
    await fields[1].setValue('CENTER-001'); // Centro
    await fields[2].setValue('PART-BRAKE-01'); // Repuesto
    await fields[3].setValue(2); // Cantidad

    await dispatchForm.trigger('submit.prevent');
    await flushPromises();

    const result = wrapper.get('[data-testid="dispatch-result"]');
    expect(result.text()).toContain('REQ-UI-001');
    expect(result.text()).toContain('AUTHORIZED');
  });

  it('muestra un error controlado y NO envia la solicitud si la cantidad es invalida', async () => {
    const fetchMock = vi.fn((url) => {
      if (url.endsWith('/api/session')) return jsonResponse({ accessToken: 'token-de-prueba' });
      if (url.endsWith('/api/dispatch-requests')) return jsonResponse({ items: [] });
      throw new Error(`No deberia llamarse a ${url} con datos invalidos`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const wrapper = mount(App);
    const loginInputs = wrapper.findAll('input');
    await loginInputs[0].setValue('candidate');
    await loginInputs[1].setValue('cualquier-password-local');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    const dispatchForm = wrapper.find('form');
    const fields = dispatchForm.findAll('input, textarea, select');
    await fields[0].setValue('REQ-UI-002');
    await fields[1].setValue('CENTER-001');
    await fields[2].setValue('PART-BRAKE-01');
    await fields[3].setValue(0); // cantidad invalida

    await dispatchForm.trigger('submit.prevent');
    await flushPromises();

    expect(wrapper.find('.error').exists()).toBe(true);
    const postCalls = fetchMock.mock.calls.filter(
  ([url, options]) => url.endsWith('/api/dispatch-requests') && options?.method === 'POST'
);
    expect(postCalls.length).toBe(0);
  });
});