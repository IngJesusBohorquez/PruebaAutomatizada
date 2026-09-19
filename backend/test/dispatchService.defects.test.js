import test from 'node:test';
import assert from 'node:assert/strict';
import { createDispatchService } from '../src/domain/dispatchService.js';

// R-01 (ver DESARROLLO.md): la regla de negocio dice que una
// requestReference ya procesada no debe descontar disponibilidad de nuevo
// y que el resultado original debe preservarse. El codigo actual no
// verifica si la referencia ya existe antes de procesar, asi que esta
// prueba documenta el comportamiento ESPERADO y hoy falla.
// Esa falla es la evidencia reproducible del defecto.
test('R-01: una requestReference repetida no debe descontar stock otra vez ni cambiar el resultado original', () => {
  const service = createDispatchService();
  const centerId = 'CENTER-001';
  const partCode = 'PART-BRAKE-01';
  const reference = 'REQ-DEFECT-001';

  const first = service.create({
    requestReference: reference,
    centerId,
    partCode,
    quantity: 10,
    priority: 'STANDARD'
  });
  assert.equal(first.result.status, 'AUTHORIZED');

  const availableAfterFirst = service.availability(centerId, partCode).available;

  // Reenvio la MISMA referencia, con datos distintos a proposito.
  const second = service.create({
    requestReference: reference,
    centerId,
    partCode,
    quantity: 25,
    priority: 'CRITICAL'
  });

  const availableAfterSecond = service.availability(centerId, partCode).available;

  assert.equal(
    availableAfterSecond,
    availableAfterFirst,
    'BUG: la disponibilidad se desconto una segunda vez para la misma requestReference'
  );
  assert.deepEqual(
    second.result,
    first.result,
    'BUG: el resultado original de la solicitud fue sobrescrito por el reenvio de la misma referencia'
  );
});