import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';

import { SwaggerView } from '../swagger';
import { ReduxIntlProviders, renderWithRouter } from '../../utils/testWithIntl';
import { API_URL } from '../../config';

describe('SwaggerView', () => {
  afterEach(() => jest.clearAllMocks());

  it('renderiza el contenedor principal', () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <SwaggerView />
      </ReduxIntlProviders>,
    );
    expect(document.querySelector('.w-100.cf')).toBeInTheDocument();
  });

  it('renderiza un iframe con el título api-docs', () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <SwaggerView />
      </ReduxIntlProviders>,
    );
    const iframe = screen.getByTitle('api-docs');
    expect(iframe).toBeInTheDocument();
  });

  it('el iframe apunta a la URL de la documentación API', () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <SwaggerView />
      </ReduxIntlProviders>,
    );
    const iframe = screen.getByTitle('api-docs');
    expect(iframe.getAttribute('src')).toContain('hotosm.github.io/swagger');
    expect(iframe.getAttribute('src')).toContain(API_URL);
  });

  it('el iframe tiene la clase fixed y w-100', () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <SwaggerView />
      </ReduxIntlProviders>,
    );
    const iframe = screen.getByTitle('api-docs');
    expect(iframe).toHaveClass('fixed');
    expect(iframe).toHaveClass('w-100');
  });

  it('el iframe no tiene bordes (clase bn)', () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <SwaggerView />
      </ReduxIntlProviders>,
    );
    const iframe = screen.getByTitle('api-docs');
    expect(iframe).toHaveClass('bn');
  });

  it('la URL del iframe incluye el endpoint de docs json del sistema', () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <SwaggerView />
      </ReduxIntlProviders>,
    );
    const iframe = screen.getByTitle('api-docs');
    expect(iframe.getAttribute('src')).toContain('system/docs/json/');
  });
});
