import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';

import { SimilarProjects } from '../similarProjects';
import { ReduxIntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
import { setupFaultyHandlers } from '../../../network/tests/server';
import messages from '../messages';

describe('Similar Projects', () => {
  it('should fetch and display similar projects', async () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <SimilarProjects projectId={123} />
      </ReduxIntlProviders>,
    );
    expect((await screen.findAllByRole('article')).length).toBe(4);
    expect(
      screen.getByRole('heading', {
        name: 'Similar Project 1',
      }),
    ).toBeInTheDocument();
  });

  it('should display error message', async () => {
    setupFaultyHandlers();
    renderWithRouter(
      <ReduxIntlProviders>
        <SimilarProjects projectId={123} />
      </ReduxIntlProviders>,
    );
    expect(
      await screen.findByText(messages.noSimilarProjectsFound.defaultMessage),
    ).toBeInTheDocument();
  });
});
