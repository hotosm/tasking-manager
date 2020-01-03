import { getRandomInt, getRandomArrayItem } from '../random';

it('test getRandomInt', () => {
  const a = getRandomInt(0, 3);
  expect(a).toBeGreaterThanOrEqual(0);
  expect(a).toBeLessThan(3);
  const b = getRandomInt(3, 5);
  expect(b).toBeGreaterThanOrEqual(3);
  expect(b).toBeLessThan(5);
});

it('test getRandomArrayItem with integers', () => {
  let arr = [235, 1003, 5495, 7921, 9094376];
  expect(arr).toContain(getRandomArrayItem(arr));
  expect(typeof getRandomArrayItem(arr)).toBe('number');
});

it('test getRandomArrayItem with two items', () => {
  let arr = [235, 1003];
  expect(arr).toContain(getRandomArrayItem(arr));
  expect(typeof getRandomArrayItem(arr)).toBe('number');
});

it('test getRandomArrayItem with one item', () => {
  let arr = [4353];
  expect(arr).toContain(getRandomArrayItem(arr));
  expect(getRandomArrayItem(arr)).toBe(4353);
});

it('test getRandomArrayItem with strings', () => {
  let arr = ['Bomba Stereo', 'Jorge Drexler', 'Fito Paez', 'Caetano Veloso'];
  expect(arr).toContain(getRandomArrayItem(arr));
  expect(typeof getRandomArrayItem(arr)).toBe('string');
});
