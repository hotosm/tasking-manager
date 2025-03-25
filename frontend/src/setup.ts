import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';
import "vitest-canvas-mock"

configure({ asyncUtilTimeout: 12000 });

// vi.mock('mapbox-gl/dist/mapbox-gl');

window.URL.createObjectURL = vi.fn();

beforeEach(() => {
  window.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});

vi.mock("react-hot-toast", {
  spy: true
})
