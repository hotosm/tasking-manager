import { useAvatarText } from '../UseAvatarText';

describe('useAvatarText — función pura', () => {
  it('extrae las iniciales del nombre completo', () => {
    expect(useAvatarText('John Doe', null, null)).toBe('JD');
  });

  it('extrae las iniciales de un nombre con 3 palabras (máximo 3 chars)', () => {
    expect(useAvatarText('John Paul Smith', null, null)).toBe('JPS');
  });

  it('no excede 3 caracteres para nombres largos', () => {
    const result = useAvatarText('Alpha Beta Gamma Delta', null, null);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('devuelve el número cuando name es null y number está presente', () => {
    expect(useAvatarText(null, 'user', 42)).toBe(42);
  });

  it('usa username cuando name es null y number es null', () => {
    expect(useAvatarText(null, 'john doe', null)).toBe('jd');
  });

  it('extrae iniciales del username con múltiples palabras', () => {
    expect(useAvatarText(null, 'alice bob', null)).toBe('ab');
  });

  it('prioriza name sobre username', () => {
    expect(useAvatarText('Ana María', 'username_xyz', null)).toBe('AM');
  });

  it('prioriza name sobre number', () => {
    expect(useAvatarText('Carlos', null, 99)).toBe('C');
  });

  it('devuelve string vacío cuando todos los parámetros son null/undefined', () => {
    expect(useAvatarText(null, null, null)).toBe('');
    expect(useAvatarText(undefined, undefined, undefined)).toBe('');
  });

  it('maneja nombre con una sola palabra', () => {
    expect(useAvatarText('Pedro', null, null)).toBe('P');
  });

  it('maneja username con una sola palabra', () => {
    expect(useAvatarText(null, 'mapper', null)).toBe('m');
  });

  it('devuelve number truthy cuando name=null y username=null', () => {
    // number=0 is falsy so the hook falls through to username. Use truthy number:
    expect(useAvatarText(null, null, 42)).toBe(42);
    expect(useAvatarText(null, null, 7)).toBe(7);
  });

  it('maneja nombre con cadena vacía (vacía se evalúa como falsy → intenta number)', () => {
    const result = useAvatarText('', 'testuser', null);
    // Empty string is falsy, goes to number branch, number is null, goes to username
    expect(result).toBe('t');
  });
});
