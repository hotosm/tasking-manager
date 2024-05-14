import { remapParamsToAPI } from '../remapParamsToAPI';

it('test if remapParamsToAPI reformat queries correctly', () => {
  const queryConversion = {
    types: 'messageType',
    fromUsername: 'from',
  };
  expect(remapParamsToAPI({ types: 1 }, queryConversion)).toEqual({ messageType: 1 });
  expect(remapParamsToAPI({ fromUsername: 'test' }, queryConversion)).toEqual({ from: 'test' });
  expect(remapParamsToAPI({ fromUsername: 'test', types: ['a', 'b'] }, queryConversion)).toEqual({
    from: 'test',
    messageType: 'a,b',
  });
});
