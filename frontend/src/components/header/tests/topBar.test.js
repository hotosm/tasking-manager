import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { TopBar } from '../topBar';

it('should display the header string passed as props', () => {
  render(<TopBar pageName="Dhamaka" />);
  expect(
    screen.getByRole('heading', {
      name: 'Dhamaka',
    }),
  ).toBeInTheDocument();
});
