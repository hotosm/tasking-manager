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

describe('sendJosmCommands popup handling', () => {
  const project = { projectId: 123, imagery: 'Bing', changesetComment: '#test' };
  const bbox = [1, 2, 3, 4];
  let originalSafari;
  let originalFetch;
  let open;

  const makePopup = () => {
    const urls = [];
    return {
      urls,
      closed: false,
      set location(url) {
        urls.push(new URL(url));
      },
      close: jest.fn(),
    };
  };

  const finishCommand = async () => {
    jest.advanceTimersByTime(1000);
    for (let i = 0; i < 10; i++) await Promise.resolve();
  };

  beforeEach(() => {
    jest.useFakeTimers();
    originalSafari = window.safari;
    originalFetch = global.fetch;
    window.safari = {};
    global.fetch = jest.fn();
    open = jest.spyOn(window, 'open');
  });

  afterEach(() => {
    window.safari = originalSafari;
    global.fetch = originalFetch;
    open.mockRestore();
    jest.useRealTimers();
  });

  it('stops sending commands when the user closes the popup between commands', async () => {
    const popup = makePopup();
    const result = sendJosmCommands(project, {}, [1], [], bbox, popup);
    popup.closed = true;
    await finishCommand();

    await expect(result).resolves.toBe(false);
    expect(popup.urls.map((url) => url.pathname)).toEqual(['/import']);
    expect(open).not.toHaveBeenCalled();
  });

  it('uses one popup for all commands and closes it after the final command', async () => {
    const popup = makePopup();
    open.mockImplementation((url) => {
      popup.urls.push(new URL(url));
      return popup;
    });

    const result = sendJosmCommands(project, {}, [1, 2], [], bbox);

    expect(open).toHaveBeenCalledTimes(1);
    expect(popup.urls.map((url) => url.pathname)).toEqual(['/version', '/import']);
    await finishCommand();
    expect(popup.urls.map((url) => url.pathname)).toEqual(['/version', '/import', '/imagery']);
    await finishCommand();
    expect(popup.urls[3].pathname).toBe('/load_and_zoom');
    expect(popup.urls[3].searchParams.get('new_layer')).toBe('true');
    await finishCommand();
    expect(popup.urls[4].pathname).toBe('/load_and_zoom');
    expect(popup.urls[4].searchParams.get('new_layer')).toBe('false');
    expect(popup.close).not.toHaveBeenCalled();
    await finishCommand();

    await expect(result).resolves.toBe(true);
    expect(popup.close).toHaveBeenCalledTimes(1);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
