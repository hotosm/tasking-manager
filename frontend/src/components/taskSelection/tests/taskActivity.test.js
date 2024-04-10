import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';

import {
  QueryClientProviders,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../../utils/testWithIntl';
import { TaskHistory } from '../taskActivity';
import messages from '../messages';

describe('TaskHistory', () => {
  it('renders the task history comments and activities for a given project', async () => {
    const { user } = renderWithRouter(
      <QueryClientProviders>
        <ReduxIntlProviders>
          <TaskHistory projectId={2} taskId={15} />
        </ReduxIntlProviders>
      </QueryClientProviders>,
    );
    expect(await screen.findByText(/Comments/)).toBeInTheDocument();
    expect(screen.getByText(/Activities/)).toBeInTheDocument();
    expect(screen.getByText(/All/)).toBeInTheDocument();
    expect(screen.getByText(messages.noCommentsYet.defaultMessage)).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /activities/i }));
    expect(screen.getByText(/locked for mapping/i)).toBeInTheDocument();
  });
});
