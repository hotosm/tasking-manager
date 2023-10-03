import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import { TaskStats, ElementsMapped } from '../elementsMapped';

describe('ElementsMapped & TaskStats components', () => {
  it('ElementsMapped component is rendered', () => {
    const userStats = {
      timeSpentMapping: 3000,
    };
    const osmStats = {
      total_building_count_add: 10,
      roads: 229.113,
      total_poi_count_add: 15,
      total_waterway_count_add: 20,
    };
    const { getByText } = render(
      <ReduxIntlProviders>
        <ElementsMapped userStats={userStats} osmStats={osmStats} />
      </ReduxIntlProviders>,
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
