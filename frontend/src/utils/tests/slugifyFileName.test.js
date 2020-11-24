import { slugifyFileName } from '../slugifyFileName';

test('slugifyFileName replaces special chars', () => {
  expect(slugifyFileName('ásdr ç.jpg')).toBe('asdr-c.jpg');
  expect(slugifyFileName('ásdr ç?#$.jpg')).toBe('asdr-c.jpg');
  expect(slugifyFileName('àõüsdr ç.png')).toBe('aousdr-c.png');
  expect(slugifyFileName('компютъра.png')).toBe('kompyutura.png');
  expect(slugifyFileName('日本.png')).toBe('5pel5pys.png');
  expect(slugifyFileName('àõü?sdr ç', 'media/jpg')).toBe('aousdr-c.jpg');
  expect(slugifyFileName('çõu-@as23+asd', 'media/png')).toBe('cou-as23asd.png');
});
