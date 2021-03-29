import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorMessage } from '../responseMessages';

describe('ErrorMessage Component', () => {
  it('shows an error message if error is not null', () => {
    const { container } = render(<ErrorMessage error={{}}>An error message</ErrorMessage>);
    expect(container.querySelectorAll('svg').length).toBe(1); //close icon
    expect(screen.queryByText(/An error message/)).toBeInTheDocument();
  });

  it('does not display an error message if error is null', () => {
    const { container } = render(<ErrorMessage error={null}>An error message</ErrorMessage>);
    expect(container.querySelectorAll('svg').length).toBe(0); //close icon
    expect(screen.queryByText(/An error message/)).not.toBeInTheDocument();
  });
});
