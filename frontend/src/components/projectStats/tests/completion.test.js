import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import { CompletionStats } from '../completion';

describe('', () => {
  it('', () => {
    const stats = {
      ready: 168,
      badImagery: 3,
      lockedForMapping: 4,
      mapped: 21,
      lockedForValidation: 6,
      validated: 2,
      invalidated: 9,
      totalTasks: 213,
    };
    const { container } = render(
      <ReduxIntlProviders>
        <CompletionStats tasksByStatus={stats} />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('Tasks to map').className).toBe('ma0 h2 f4 fw6 blue-grey ttl');
    expect(screen.getByText('177').className).toBe('ma0 mb2 barlow-condensed f1 b red');
    expect(screen.getByText('/ 213').className).toBe('dib f3 pl2 blue-grey');
    expect(screen.getByText('Tasks to validate').className).toBe('ma0 h2 f4 fw6 blue-grey ttl');
    expect(screen.getByText('202').className).toBe('ma0 mb2 barlow-condensed f1 b red');
    expect(container.querySelectorAll('h3').length).toBe(2);
  });
});
