import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ReduxIntlProviders } from '../../utils/testWithIntl';
import { BasemapMenu } from '../basemapMenu';

describe('BaseMapMenu component', () => {
  it('render 3 options on BaseMapMenu if no mapbox token is given', () => {
    render(
      <ReduxIntlProviders>
        <BasemapMenu map={{}} />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText(/humanitarian/)).toBeInTheDocument();
    expect(screen.getByText(/bing/)).toBeInTheDocument();
    expect(screen.getByText(/density/)).toBeInTheDocument();
  });
});
