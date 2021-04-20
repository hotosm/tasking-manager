import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorAlert } from '../error';

describe('ErrorAlert Component', () => {
  it('shows an error message if passed one', () => {
    const { container } = render(<ErrorAlert>An error message</ErrorAlert>);
    expect(container.querySelector('svg')).toBeInTheDocument(); // ban icon
    expect(container.querySelector('div').className).toBe(
      'db blue-dark bl b--red bw2 br2 bg-red-light pa3',
    );
    expect(screen.queryByText(/An error message/)).toBeInTheDocument();
  });
});
