# Desarrollo

## 1. Riesgos priorizados

Riesgo 1: Despacho duplicado por reenvio de `requestReference`
Porque: Descuenta disponibilidad real dos veces -> un repuesto que otro centro con un vehiculo inmovilizado no podra pedir. Es la regla de negocio mas importante del enunciado.
Como se cubre: unitaria de dominio (`dispatchService.defects.test.js`). Confirma el bug: la prueba falla en rojo a proposito (ver seccion "Defectos encontrados" mas abajo).

Riesgo 2: Autorizacion sin disponibilidad real suficiente
Porque: Mismo tipo de dano que R1 (sobreventa), pero por un calculo incorrecto en vez de un reenvio.
Como se cubre: unitaria de dominio (`dispatchService.test.js`): se agota el stock dentro de la prueba y se verifica que el rechazo no descuenta de mas.

Riesgo 3: Validacion de entradas insuficiente
Porque: Podria romper el sistema o exponer detalles internos ante datos inesperados (punto 5.8 del enunciado).
Como se cubre: unitaria de dominio (quantity invalida, ej. 0). Pendiente: caso de integracion backend con JSON malformado.

Riesgo 4: Rutas sin proteccion de sesion
Porque: Fuga de datos de solicitudes entre distintos centros de servicio.
Como se cubre: pendiente, integracion backend.

Riesgo 5: Degradacion bajo carga en `/api/availability`
Porque: Objetivo de negocio explicito: 30solicitudes sostenidas, picos cercanos a 60 solicitudes  (punto 5.7 del enunciado).
Como se cubre: pendiente, prueba de carga.

## 2. Defectos encontrados

Defecto DEF-01: Idempotencia de requestReference (bug confirmado)

Regla violada (seccion 3 del enunciado): "Una requestReference ya procesada no debe provocar un segundo despacho ni descontar disponibilidad nuevamente [...] debe preservarse el resultado original."

Comportamiento actual: en `backend/src/domain/dispatchService.js`, el metodo `create` no verifica si `input.requestReference` ya existe antes de procesar. Cada llamada con la misma referencia vuelve a evaluar disponibilidad, descuenta stock de nuevo, y sobrescribe el resultado guardado.

Evidencia reproducible: `backend/test/dispatchService.defects.test.js`. Salida real obtenida al ejecutar `npm test`:

AssertionError [ERR_ASSERTION]: BUG: la disponibilidad se desconto una segunda vez para la misma requestReference
4965 !== 4990

Se autorizo una solicitud de 10 unidades sobre CENTER-001/PART-BRAKE-01 (disponibilidad inicial 5000 -> 4990). Al reenviar la MISMA requestReference con otra cantidad (25), volvio a descontar (4990 -> 4965) en vez de devolver el resultado original sin tocar stock.

Impacto de negocio: sobreventa de repuestos criticos y perdida de trazabilidad del resultado original de una solicitud.

Corregido: No. El enunciado indica que no es obligatorio corregir, solo documentar con evidencia reproducible. Se prioriza dejar la prueba en rojo como esa evidencia, en vez de modificar el dominio de la aplicacion.
