import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Code } from '../code';

describe('Code', () => {
  it('with default formatting', () => {
    const { container } = render(<Code>testing it</Code>);
    expect(container.querySelector('code').className).toBe('f6 i ph1 bg-white o-80 ');
    expect(screen.getByText('testing it')).toBeInTheDocument();
  });

  it('with additional classNames', () => {
    const { container } = render(<Code className="red f7 db">http://example.url</Code>);
    expect(container.querySelector('code').className).toBe('f6 i ph1 bg-white o-80 red f7 db');
    expect(screen.getByText('http://example.url')).toBeInTheDocument();
  });
});
