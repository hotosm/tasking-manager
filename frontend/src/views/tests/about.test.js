import '@testing-library/jest-dom';
import { screen, waitFor } from '@testing-library/react';

import { AboutPage } from '../about';
import { ReduxIntlProviders, renderWithRouter } from '../../utils/testWithIntl';

// Mock TopBar — it uses router/redux context that's complex to set up
jest.mock('../../components/header/topBar', () => ({
  TopBar: ({ pageName }) => <header data-testid="top-bar">{pageName}</header>,
}));

// Mock image import
jest.mock('../../assets/img/osi_standard_logo_0.png', () => 'osi-logo-mock.png');

const renderAbout = () =>
  renderWithRouter(
    <ReduxIntlProviders>
      <AboutPage />
    </ReduxIntlProviders>,
  );

describe('AboutPage', () => {
  afterEach(() => jest.clearAllMocks());

  it('renderiza el componente sin errores', () => {
    renderAbout();
    expect(document.querySelector('.pull-center.bg-white')).toBeInTheDocument();
  });

  it('renderiza el TopBar con el texto about', () => {
    renderAbout();
    expect(screen.getByTestId('top-bar')).toBeInTheDocument();
  });

  it('renderiza el enlace a OpenStreetMap', () => {
    renderAbout();
    // There may be multiple links; find the one pointing to openstreetmap.org
    const links = screen.getAllByRole('link');
    const osmLink = links.find((l) => l.getAttribute('href') === 'https://openstreetmap.org');
    expect(osmLink).toBeDefined();
  });

  it('renderiza el enlace a OSM Wiki', () => {
    renderAbout();
    const wikiLink = screen.getByRole('link', { name: /osm wiki/i });
    expect(wikiLink).toHaveAttribute('href', 'https://wiki.openstreetmap.org/');
  });

  it('renderiza el enlace a Humanitarian OpenStreetMap Team', () => {
    renderAbout();
    const hotLink = screen.getByRole('link', { name: /humanitarian openstreetmap team/i });
    expect(hotLink).toHaveAttribute('href', 'https://hotosm.org');
  });

  it('renderiza el enlace al repositorio en GitHub', () => {
    renderAbout();
    const githubLink = screen.getByRole('link', { name: /github/i });
    expect(githubLink).toHaveAttribute('href', 'https://github.com/hotosm/tasking-manager');
  });

  it('renderiza el enlace a las FAQs del modelo de sostenibilidad', () => {
    renderAbout();
    const faqLink = screen.getByRole('link', { name: /faq/i });
    expect(faqLink).toHaveAttribute(
      'href',
      'https://docs.google.com/document/d/1p0zGfvANgrynn7vnOND-2rK4HHKbWVha9Xx8jfOwick',
    );
  });

  it('renderiza el logo de OSI', () => {
    renderAbout();
    // The alt text from about.js is "OSI aproved license" (typo in source)
    const osiImg = document.querySelector('img[alt]');
    expect(osiImg).toBeInTheDocument();
    expect(osiImg.getAttribute('src')).toBe('osi-logo-mock.png');
  });

  it('renderiza la sección FLOSS con el encabezado h1', () => {
    renderAbout();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeInTheDocument();
  });

  it('renderiza párrafos de descripción de la página', () => {
    renderAbout();
    // Multiple paragraphs render inside the main content div
    const paragraphs = document.querySelectorAll('p');
    expect(paragraphs.length).toBeGreaterThan(3);
  });

  it('el contenedor tiene la clase correcta de layout', () => {
    renderAbout();
    expect(document.querySelector('.pt180.pull-center')).toBeInTheDocument();
  });
});
