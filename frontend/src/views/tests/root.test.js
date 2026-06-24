import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { Root } from '../root';

jest.mock('../../components/banner/topBanner', () => ({
  TopBanner: () => <div data-testid="top-banner">Top Banner</div>,
}));

jest.mock('../../components/header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

jest.mock('../../components/footer', () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}));

describe('Root view', () => {
  it('renders the main layout and the child route content', () => {
    render(
      <MemoryRouter initialEntries={['/test']}>
        <Routes>
          <Route element={<Root />}>
            <Route path="/test" element={<main>Contenido de prueba</main>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('top-banner')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByText('Contenido de prueba')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});