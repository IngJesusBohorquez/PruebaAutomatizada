# Desarrollo 

## 1. Riesgos priorizados

 Riesgo / Por que importa / Como se cubre |

Riesgo 1: Despacho duplicado por reenvio de `requestReference` 
Porque : Descuenta disponibilidad real dos veces -> un repuesto que otro centro con un vehiculo inmovilizado no podra pedir. Es la regla de negocio mas importante  del enunciado.
Como se cubre : unitaria de dominio 


Riesgo 2: Autorizacion sin disponibilidad real suficiente 
Porque: Mismo tipo de dano que R1 (sobreventa), pero por un calculo incorrecto en vez de un reenvio.
Como se cubre: unitaria de dominio 


Riesgo 3: Validacion de entradas insuficiente 
Porque: Podria romper el sistema o exponer detalles internos ante datos inesperados (punto 5.8)
Como se cubre: unitaria + integracion backend 


Riesgo 4: Rutas sin proteccion de sesion 
Porque:  Fuga de datos de solicitudes entre distintos centros de servicio. 
Como se cubre:  integracion backend 


Riesgo 5: Degradacion bajo carga en `/api/availability` 
Porque:  Objetivo de negocio explicito: 30 solicitudes/s  sostenidos, picos 60 solicitudes/s  (Punto 5.7)
Como se subre:  Pendiente: prueba de carga 

## 2. Supuestos

