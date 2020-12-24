import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';

import { MultipleTaskHistoriesAccordion } from '../accordion';
import { multipleTaskInfo } from '../../network/tests/mockData/taskHistory';
import { ReduxIntlProviders } from '../../utils/testWithIntl';

describe('MultipleTasKHistories Accordion', () => {
  let handleChange = jest.fn();

  it('does not render accordion with task history items if there are no tasks', () => {
    render(
      <ReduxIntlProviders>
        <MultipleTaskHistoriesAccordion
          handleChange={handleChange}
          tasks={[]}
          projectId={1}
          mapperLevel={''}
        />
      </ReduxIntlProviders>,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(handleChange).not.toHaveBeenCalled();
    expect(screen.queryByText(/Comments/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Activities/i)).not.toBeInTheDocument();
  });

  it('renders accordion correctly with task history items for 2 tasks', () => {
    render(
      <ReduxIntlProviders>
        <MultipleTaskHistoriesAccordion
          handleChange={handleChange}
          tasks={multipleTaskInfo}
          projectId={1}
          mapperLevel={''}
        />
      </ReduxIntlProviders>,
    );

    expect(screen.getByText(/Task 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Task 2/i)).toBeInTheDocument();

    const taskAccordionItems = screen.getAllByRole('button');
    taskAccordionItems.forEach((taskBtn) => {
      fireEvent.click(taskBtn);
    });

    expect(handleChange).toHaveBeenCalledTimes(2);
    expect(screen.getAllByText(/Comments/i)).toHaveLength(2);
    expect(screen.getAllByText(/Activities/i)).toHaveLength(2);
  });
});
