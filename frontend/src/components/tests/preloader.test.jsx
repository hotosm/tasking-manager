import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Preloader } from '../preloader';

test('Preloader renders correct content', () => {
  const { container } = render(<Preloader />);
  expect(container.querySelector('div').className).toBe(
    'fixed vh-100 w-100 flex justify-center items-center bg-white',
  );
  expect(container.querySelector('svg')).toBeInTheDocument();
  expect(container.querySelector('.red.h3.w3')).toBeInTheDocument();
});
