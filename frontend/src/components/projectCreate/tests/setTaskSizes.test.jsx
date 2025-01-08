import { render, screen } from '@testing-library/react';

import SetTaskSizes from '../setTaskSizes';
import { projectMetadata } from '../../../utils/tests/snippets/projectMetadata';
import { IntlProviders } from '../../../utils/testWithIntl';

vi.mock('mapbox-gl/dist/mapbox-gl', async (importOriginal) => ({
  ...(await importOriginal()),
  GeolocateControl: vi.fn(),
  Map: vi.fn(() => ({
    addControl: vi.fn(),
    on: vi.fn(),
    remove: vi.fn(),
    getSource: vi.fn(),
    fitBounds: vi.fn(),
    off: vi.fn(),
    addSource: vi.fn(),
  })),
  NavigationControl: vi.fn(),
}));

let mapObj = {
  map: null,
  draw: {},
};

describe('setTaskSizes Component', () => {
  const updateMetadata = vi.fn();
  it('renders a panel to split an AOI into a task grid', () => {
    render(
      <IntlProviders>
        <SetTaskSizes metadata={projectMetadata} mapObj={mapObj} updateMetadata={updateMetadata} />
      </IntlProviders>,
    );
    expect(screen.getByText(/Step 2: set tasks sizes/)).toBeInTheDocument();
    expect(screen.getByText(/General task size/)).toBeInTheDocument();
    expect(screen.getByText(/Smaller/)).toBeInTheDocument();
    expect(screen.getByText(/Larger/)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Make tasks smaller by clicking on specific tasks or drawing an area on the map./,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/Click to split/)).toBeInTheDocument();
    expect(screen.getByText(/Draw area to split/)).toBeInTheDocument();
    expect(screen.getByText(/Reset/)).toBeInTheDocument();

    // source: https://polvara.me/posts/five-things-you-didnt-know-about-testing-library tip-4
    // test for the text displaying the number of tasks a project is created with
    screen.getByText((content, node) => {
      const hasText = (node) => node.textContent === 'A new project will be created with 0 tasks.';
      const nodeHasText = hasText(node);
      const childrenDontHaveText = Array.from(node.children).every((child) => !hasText(child));
      return nodeHasText && childrenDontHaveText;
    });
  });

  // To do: simulate splitting and making the task grid smaller/bigger
});
