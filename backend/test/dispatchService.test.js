import test from 'node:test';
import assert from 'node:assert/strict';
import { createDispatchService } from '../src/domain/dispatchService.js';

// Cada prueba crea su propia instancia del servicio (createDispatchService
// recarga el seed cada vez), asi que quedan aisladas entre si: lo que hace
// una prueba con el stock no afecta a las demas.

test('camino feliz: autoriza una solicitud valida cuando hay disponibilidad suficiente', () => {
  const service = createDispatchService();
  const before = service.availability('CENTER-001', 'PART-BRAKE-01').available;

  const outcome = service.create({
    requestReference: 'REQ-UNIT-001',
    centerId: 'CENTER-001',
    partCode: 'PART-BRAKE-01',
    quantity: 3,
    priority: 'STANDARD'
  });

  assert.equal(outcome.kind, 'created');
  assert.equal(outcome.result.status, 'AUTHORIZED');
  assert.equal(outcome.result.reason, null);

  const after = service.availability('CENTER-001', 'PART-BRAKE-01').available;
  assert.equal(after, before - 3, 'debe descontar exactamente la cantidad autorizada');
});

test('R2: rechaza una solicitud cuando la cantidad supera la disponibilidad, sin descontar stock', () => {
  const service = createDispatchService();
  const centerId = 'CENTER-002';
  const partCode = 'PART-BRAKE-01'; // stock inicial: 2500

  // quantity esta acotado a 1-50, asi que para forzar "cantidad > disponibilidad"
  // primero agotamos el stock con solicitudes validas, y luego pedimos mas
  // de lo que queda (siempre dentro de 1-50).
  let remaining = service.availability(centerId, partCode).available;
  let i = 0;
  while (remaining >= 50) {
    const r = service.create({
      requestReference: `REQ-DRAIN-${i++}`,
      centerId,
      partCode,
      quantity: 50,
      priority: 'STANDARD'
    });
    assert.equal(r.result.status, 'AUTHORIZED');
    remaining = service.availability(centerId, partCode).available;
  }

  const before = remaining; // ya quedo por debajo de 50
  const outcome = service.create({
    requestReference: 'REQ-UNIT-002',
    centerId,
    partCode,
    quantity: before + 1,
    priority: 'STANDARD'
  });

  assert.equal(outcome.result.status, 'REJECTED');
  assert.equal(outcome.result.reason, 'INSUFFICIENT_AVAILABILITY');

  const after = service.availability(centerId, partCode).available;
  assert.equal(after, before, 'un rechazo NO debe modificar la disponibilidad');
});

test('entrada invalida: quantity 0 no crea la solicitud', () => {
  const service = createDispatchService();

  const outcome = service.create({
    requestReference: 'REQ-UNIT-003',
    centerId: 'CENTER-001',
    partCode: 'PART-BRAKE-01',
    quantity: 0,
    priority: 'STANDARD'
  });

  assert.equal(outcome.kind, 'validation_error');
  assert.ok(outcome.errors.length > 0);
  assert.equal(service.get('REQ-UNIT-003'), null, 'no debe quedar registrada una solicitud invalida');
});