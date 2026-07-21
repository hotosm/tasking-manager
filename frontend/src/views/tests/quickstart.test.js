import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';

import { ReduxIntlProviders, renderWithRouter } from '../../utils/testWithIntl';
import { QuickstartPage } from '../quickstart';

describe('QuickstartPage', () => {
  const setup = () =>
    renderWithRouter(
      <ReduxIntlProviders>
        <QuickstartPage />
      </ReduxIntlProviders>,
    );

  it('renders the page title heading', () => {
    setup();
    expect(screen.getByRole('heading', { name: /quickstart guide/i })).toBeInTheDocument();
  });

  it('renders the introductory paragraph', () => {
    setup();
    // The intro paragraph is rendered via FormattedMessage quickstartIntro
    const paragraphs = document.querySelectorAll('p');
    expect(paragraphs.length).toBeGreaterThan(0);
  });

  it('renders all 9 step images', () => {
    setup();
    const images = screen.getAllByRole('img');
    // One image per quickstart step (steps 1-9)
    expect(images.length).toBeGreaterThanOrEqual(9);
  });

  it('renders step numbers 1 through 9', () => {
    setup();
    for (let i = 1; i <= 9; i++) {
      expect(screen.getByText(`${i}.`)).toBeInTheDocument();
    }
  });

  it('renders screenshot alt texts for each step', () => {
    setup();
    for (let i = 1; i <= 9; i++) {
      expect(
        screen.getByAltText(`Quickstart guide screenshot of step ${i}`),
      ).toBeInTheDocument();
    }
  });

  it('renders a link to the home page inside step content', () => {
    setup();
    const homeLinks = screen.getAllByRole('link', { name: /tasking manager/i });
    expect(homeLinks.length).toBeGreaterThanOrEqual(1);
    expect(homeLinks[0]).toHaveAttribute('href', '/');
  });

  it('renders a link to the learn/map page', () => {
    setup();
    const learnLink = screen.getByRole('link', { name: /learn pages/i });
    expect(learnLink).toBeInTheDocument();
    expect(learnLink).toHaveAttribute('href', '/learn/map');
  });

  it('renders italic note paragraphs for steps that have notes', () => {
    setup();
    // Steps 7, 8, 9 have notes rendered as italic <p> elements
    const italicParagraphs = document.querySelectorAll('p.i');
    // The intro note + notes for steps with a 'note' property (1Note, 7Note, 8Note, 9Note)
    expect(italicParagraphs.length).toBeGreaterThanOrEqual(2);
  });
});
