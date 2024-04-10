import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ReduxIntlProviders, QueryClientProviders } from '../../../utils/testWithIntl';
import { TaskStats, ElementsMapped } from '../elementsMapped';

describe('ElementsMapped & TaskStats components', () => {
  it('ElementsMapped component is rendered', () => {
    const userStats = {
      timeSpentMapping: 3000,
    };
    const osmStats = {
      poi: {
        added: 4,
        modified: {
          count_modified: 1,
        },
        deleted: 0,
        value: 4,
      },
      highway: {
        added: 6,
        modified: {
          count_modified: 21,
        },
        deleted: 0,
        value: 229,
      },
      building: {
        added: 293,
        modified: {
          count_modified: 83,
        },
        deleted: 44,
        value: 249,
      },
      waterway: {
        added: 16,
        modified: {
          count_modified: 27,
        },
        deleted: 0,
        value: 17,
      },
    };
    const { getByText } = render(
      <QueryClientProviders>
        <ReduxIntlProviders>
          <ElementsMapped userStats={userStats} osmStats={osmStats} />
        </ReduxIntlProviders>
      </QueryClientProviders>,
    );

    expect(getByText('Time spent mapping')).toBeInTheDocument();
    expect(getByText('Buildings mapped')).toBeInTheDocument();
    expect(getByText('Km road mapped')).toBeInTheDocument();
    expect(getByText('Points of interests mapped')).toBeInTheDocument();
    expect(getByText('Km waterways mapped')).toBeInTheDocument();
    //total road mapped
    expect(getByText('229')).toBeInTheDocument();
  });

  it('TaskStats component is rendered', () => {
    const userStats = {
      tasksMapped: 9,
      tasksValidatedByOthers: 8,
      tasksInvalidatedByOthers: 0,
      tasksValidated: 3,
      tasksInvalidated: 2,
    };
    const { getByText, getAllByText } = render(
      <ReduxIntlProviders>
        <TaskStats userStats={userStats} />
      </ReduxIntlProviders>,
    );

    expect(getByText('You mapped')).toBeInTheDocument();
    expect(getByText('You validated')).toBeInTheDocument();
    expect(getByText('Validated')).toBeInTheDocument();
    expect(getByText('Finished')).toBeInTheDocument();
    expect(getAllByText('tasks').length).toBe(2);
    expect(getAllByText('Needed more mapping').length).toBe(2);
    //mapped tasks
    expect(getByText('9')).toBeInTheDocument();
    //validated tasks
    expect(getByText('5')).toBeInTheDocument();
  });
});
