import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import mapboxgl from 'mapbox-gl';

import SetTaskSizes from '../setTaskSizes';
import { projectMetadata } from '../../../utils/tests/snippets/projectMetadata';
import { IntlProviders } from '../../../utils/testWithIntl';

jest.mock('mapbox-gl/dist/mapbox-gl', () => ({
  GeolocateControl: jest.fn(),
  Map: jest.fn(() => ({
    addControl: jest.fn(),
    on: jest.fn(),
    remove: jest.fn(),
    getSource: jest.fn(),
    fitBounds: jest.fn(),
    off: jest.fn(),
    addSource: jest.fn(),
  })),
  NavigationControl: jest.fn(),
}));

const map = new mapboxgl.Map({
  container: '',
  style: {},
  center: [0, 0],
  zoom: 1.3,
  attributionControl: false,
  source: 'grid',
});

let mapObj = {
  map: map,
  draw: {},
};

describe('setTaskSizes Component', () => {
  const updateMetadata = jest.fn();
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
    screen.getByText((content, node) => {
      const hasText = (node) => node.textContent === 'A new project will be created with 0 tasks.';
      const nodeHasText = hasText(node);
      const childrenDontHaveText = Array.from(node.children).every((child) => !hasText(child));
      return nodeHasText && childrenDontHaveText;
    });
  });
  // To do: simulate splitting and making the task grid smaller/bigger
});
