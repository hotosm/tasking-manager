import { sendJosmCommands } from '../openEditor';

describe('sendJosmCommands', () => {
  let originalFetch;
  const bbox = [1, 2, 3, 4];

  const flushPromises = async () => {
    for (let i = 0; i < 10; i++) await Promise.resolve();
  };

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('waits for each task download before starting the next', async () => {
    const downloads = [];
    global.fetch = jest.fn((url) => {
      if (url.pathname === '/load_and_zoom') {
        return new Promise((resolve) => downloads.push(resolve));
      }
      return Promise.resolve({ status: 200 });
    });

    const result = sendJosmCommands({ projectId: 123 }, {}, [1, 2], [], bbox);
    await flushPromises();

    expect(global.fetch.mock.calls.map(([url]) => url.pathname)).toEqual([
      '/import',
      '/load_and_zoom',
    ]);

    downloads[0]({ status: 200 });
    await flushPromises();
    expect(global.fetch.mock.calls.map(([url]) => url.pathname)).toEqual([
      '/import',
      '/load_and_zoom',
      '/load_and_zoom',
    ]);

    downloads[1]({ status: 200 });
    await expect(result).resolves.toBe(true);
  });
});
