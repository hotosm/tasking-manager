import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import FileRejections from '../fileRejections';

describe('FileRejections', () => {
  it('with an empty file array renders only a ul element', () => {
    const { container } = render(<FileRejections files={[]} />);
    expect(container.querySelector('ul').children.length).toBe(0);
  });

  it('renders a li element to each file', () => {
    const files = [
      {
        file: { path: '/home/test/file.csv' },
        errors: [
          { code: 1, message: 'Format not supported' },
          { code: 2, message: 'Size bigger than 100kb' },
        ],
      },
      {
        file: { path: '/home/test/file.txt' },
        errors: [{ code: 1, message: 'Format not supported' }],
      },
    ];
    const { container } = render(<FileRejections files={files} />);
    expect(container.querySelectorAll('li').length).toBe(2);
    expect(container.querySelectorAll('li')[0].className).toBe('red');
    expect(screen.queryByText(/file.csv/).className).toBe('red');
    expect(screen.queryByText(/file.txt/).className).toBe('red');
    expect(screen.queryAllByText(/Format not supported/).length).toBe(2);
    expect(screen.queryAllByText(/Format not supported/)[0].className).toBe('dib pr2');
    expect(screen.queryByText(/Size bigger than 100kb/).className).toBe('dib pr2');
  });
});
