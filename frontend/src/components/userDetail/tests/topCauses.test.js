import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import TopCauses from '../topCauses';

jest.mock('react-chartjs-2', () => ({
  Doughnut: () => null,
}));

describe('TopCauses card', () => {
  it('renders a message if the user has not projects mapped yet', () => {
    const stats = {
      ContributionsByInterest: [
        { id: 1, name: 'Public Transportation', countProjects: 0 },
        { id: 2, name: 'Health Support', countProjects: 0 },
      ],
      projectsMapped: 0,
    };
    render(
      <ReduxIntlProviders>
        <TopCauses userStats={stats} />
      </ReduxIntlProviders>,
    );

    expect(screen.getByText('Top causes contributed to').className).toBe('f125 mv3 fw6');
    expect(
      screen.getByText('Information is not available because no projects were mapped until now.'),
    ).toBeInTheDocument();
  });

  it('renders the chart if user has mapped projects already', () => {
    const stats = {
      ContributionsByInterest: [
        { id: 1, name: 'Public Transportation', countProjects: 1 },
        { id: 2, name: 'Health Support', countProjects: 2 },
        { id: 2, name: 'Cycling Support', countProjects: 2 },
        { id: 2, name: 'Environment Support', countProjects: 2 },
      ],
      projectsMapped: 7,
    };
    render(
      <ReduxIntlProviders>
        <TopCauses userStats={stats} />
      </ReduxIntlProviders>,
    );

    expect(screen.getByText('Top causes contributed to').className).toBe('f125 mv3 fw6');
    expect(
      screen.queryByText('Information is not available because no projects were mapped until now.'),
    ).not.toBeInTheDocument();
  });
});
