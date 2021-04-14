import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorMessage } from '../responseMessages';

describe('ErrorMessage Component', () => {
  it('shows an error message if passed one', () => {
    const { container } = render(<ErrorMessage>An error message</ErrorMessage>);
    expect(container.querySelectorAll('svg').length).toBe(1); //close icon
    expect(screen.queryByText(/An error message/)).toBeInTheDocument();
  });
});
