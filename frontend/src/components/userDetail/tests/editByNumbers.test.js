import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import EditsByNumbers from '../editsByNumbers';

jest.mock('react-chartjs-2', () => ({
  Doughnut: () => null,
}));

describe('EditsByNumbers card', () => {
  it('renders a message if the user has not stats yet', () => {
    render(
      <ReduxIntlProviders>
        <EditsByNumbers osmStats={{}} />
      </ReduxIntlProviders>,
    );

    expect(screen.getByText('Edits by numbers').className).toBe('f125 mv3 fw6');
    expect(
      screen.getByText(
        'No data to show yet. OpenStreetMap edits stats are updated with a delay of one hour.',
      ),
    ).toBeInTheDocument();
  });

  it('renders the chart if osmStats data is present', () => {
    const stats = {
      buildings: 3282,
      total_waterway_count_add: 11493,
      total_poi_count_add: 10805,
      roads: 5571.84370201545,
      total_waterway_km_add: 512.706405358494,
      total_road_count_add: 13345,
      total_road_count_mod: 51730,
    };
    render(
      <ReduxIntlProviders>
        <EditsByNumbers osmStats={stats} />
      </ReduxIntlProviders>,
    );

    expect(screen.getByText('Edits by numbers').className).toBe('f125 mv3 fw6');
    expect(
      screen.queryByText(
        'No data to show yet. OpenStreetMap edits stats are updated with a delay of one hour.',
      ),
    ).not.toBeInTheDocument();
  });
});
