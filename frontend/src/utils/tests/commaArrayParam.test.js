import { CommaArrayParam } from '../CommaArrayParam';

it('test CommaArrayParam encode', () => {
  expect(CommaArrayParam.encode(['a', 'b'])).toEqual('a,b');
});
it('test CommaArrayParam decode', () => {
  expect(CommaArrayParam.decode('a,b')).toStrictEqual(['a', 'b']);
});
