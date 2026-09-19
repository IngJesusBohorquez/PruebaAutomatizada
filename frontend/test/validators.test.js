/**import { describe, expect, it } from 'vitest';
import { validQuantity } from '../src/utils/validators.js';

describe('validQuantity', () => {
  it('accepts a representative quantity', () => {
    expect(validQuantity(5)).toBe(true);
  });
});**/ 
//Esto estaba antes 


import { describe, expect, it } from 'vitest';
import { validQuantity } from '../src/utils/validators.js';

describe('validQuantity', () => {
  it('acepta una cantidad representativa dentro de rango', () => {
    expect(validQuantity(5)).toBe(true);
  });

  it('acepta los limites del rango (1 y 50)', () => {
    expect(validQuantity(1)).toBe(true);
    expect(validQuantity(50)).toBe(true);
  });

  it('rechaza valores fuera de rango', () => {
    expect(validQuantity(0)).toBe(false);
    expect(validQuantity(51)).toBe(false);
    expect(validQuantity(-1)).toBe(false);
  });

  it('rechaza valores no enteros', () => {
    expect(validQuantity(1.5)).toBe(false);
  });

  it('rechaza entradas no numericas o vacias', () => {
    expect(validQuantity('')).toBe(false);
    expect(validQuantity('abc')).toBe(false);
    expect(validQuantity(null)).toBe(false);
    expect(validQuantity(undefined)).toBe(false);
  });

  it('acepta un string numerico dentro de rango (como llega desde un input type=number)', () => {
    expect(validQuantity('10')).toBe(true);
  });
});