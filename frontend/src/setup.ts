import '@testing-library/jest-dom/vitest';

// vi.mock('mapbox-gl/dist/mapbox-gl');

window.URL.createObjectURL = vi.fn();

beforeEach(() => {
  window.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});
