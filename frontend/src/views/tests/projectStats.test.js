import React from 'react';
import { Provider } from 'react-redux';
import { render, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { store } from '../../store';
import { ConnectedIntl } from '../../utils/internationalization';
import { ProjectStats } from '../projectStats';

describe('ProjectStats dashboard', () => {
  it('fetch urls and render sections title', async () => {
    jest.spyOn(window, 'fetch');

    const { container } = await render(
      <Provider store={store}>
        <ConnectedIntl>
          <ProjectStats id={1} />
        </ConnectedIntl>
      </Provider>,
    );
    window.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        changesets: 987654321,
        users: 112,
        roads: 5658.62006919192,
        buildings: 12923,
        edits: 123456789,
        latest: '2020-10-05T23:21:22.000Z',
        hashtag: `hotosm-project-1`,
      }),
    });
    await waitFor(() => screen.getByText('#1'));
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('Urgent')).toBeInTheDocument();
    await waitFor(() => container.querySelector('[aria-valuenow="28"]'));

    expect(screen.getByText('Edits')).toBeInTheDocument();
    expect(screen.getByText('987654321')).toBeInTheDocument();
    expect(screen.getByText('123456789')).toBeInTheDocument();
    expect(screen.getByText('Changesets')).toBeInTheDocument();
    expect(screen.getByText('Total map edits')).toBeInTheDocument();
    expect(screen.getByText('Tasks by status')).toBeInTheDocument();
    expect(screen.getByText('Contributors')).toBeInTheDocument();
    expect(screen.getByText('Project timeline')).toBeInTheDocument();

    await waitFor(() => screen.getByText('Time statistics'));
    expect(screen.getByText('Time statistics')).toBeInTheDocument();
  }, 10000);
});
