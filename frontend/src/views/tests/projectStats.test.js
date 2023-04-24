import '@testing-library/jest-dom';
import { render, waitFor, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { store } from '../../store';
import { QueryClientProviders, ReduxIntlProviders } from '../../utils/testWithIntl';
import { ProjectStats } from '../projectStats';

jest.mock('react-chartjs-2', () => ({
  Doughnut: () => null,
  Bar: () => null,
  Line: () => null,
}));

describe('ProjectStats dashboard', () => {
  it('fetch urls and render sections title', async () => {
    store.dispatch({ type: 'SET_LOCALE', locale: 'en-US' });
    const { container } = render(
      <MemoryRouter initialEntries={['/projects/1']}>
        <Routes>
          <Route
            path="/projects/:id"
            element={
              <QueryClientProviders>
                <ReduxIntlProviders>
                  <ProjectStats />
                </ReduxIntlProviders>
              </QueryClientProviders>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => screen.getByText('#1'));
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('Urgent')).toBeInTheDocument();
    await waitFor(() => container.querySelector('[aria-valuenow="28"]'));

    expect(await screen.findByText('Edits')).toBeInTheDocument();
    expect(screen.getByText('987,654,321')).toBeInTheDocument();
    expect(screen.getByText('123,456,789')).toBeInTheDocument();
    expect(screen.getByText('Changesets')).toBeInTheDocument();
    expect(screen.getByText('Total map edits')).toBeInTheDocument();
    expect(screen.getByText('Tasks by status')).toBeInTheDocument();
    expect(screen.getByText('Project timeline')).toBeInTheDocument();
    await waitFor(() => screen.getByText('Time statistics'));
    expect(screen.getByText('Time statistics')).toBeInTheDocument();
    await waitFor(() => screen.getByText('Contributors'));
    expect(screen.getByText('Contributors')).toBeInTheDocument();
  });
});
