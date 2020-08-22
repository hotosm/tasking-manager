import React from 'react';
import { IntlProvider } from 'react-intl';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { TaskFilter } from '../taskList';

describe('test TaskFilter with userCanValidate TRUE', () => {
  let statusFilter = 'all';
  function setStatus(status) {
    statusFilter = status;
  }
  it('render 4 buttons and the first one is active', async () => {
    render(
      <IntlProvider locale="en">
        <TaskFilter userCanValidate={true} statusFilter={statusFilter} setStatusFn={setStatus} />
      </IntlProvider>,
    );

    expect(screen.getAllByRole('button').length).toBe(4);
    expect(screen.getByText('All').className).toContain('bg-blue-grey white');
    expect(screen.getByText('Available for mapping').className).toContain('bg-white blue-grey');
    expect(screen.getByText('Ready for validation').className).toContain('bg-white blue-grey');
    expect(screen.getByText('Unavailable').className).toContain('bg-white blue-grey');
    fireEvent.click(screen.getByText('Available for mapping'));
    expect(statusFilter).toBe('readyToMap');
  });

  it('Available for mapping is active and then click on Ready for validation', () => {
    render(
      <IntlProvider locale="en">
        <TaskFilter userCanValidate={true} statusFilter={statusFilter} setStatusFn={setStatus} />
      </IntlProvider>,
    );
    expect(screen.getByText('All').className).toContain('bg-white blue-grey');
    expect(screen.getByText('Available for mapping').className).toContain('bg-blue-grey white');
    expect(screen.getByText('Ready for validation').className).toContain('bg-white blue-grey');
    expect(screen.getByText('Unavailable').className).toContain('bg-white blue-grey');
    fireEvent.click(screen.getByText('Ready for validation'));
    expect(statusFilter).toBe('readyToValidate');
  });

  it('Ready for validation is active and then click on Unavailable', () => {
    render(
      <IntlProvider locale="en">
        <TaskFilter userCanValidate={true} statusFilter={statusFilter} setStatusFn={setStatus} />
      </IntlProvider>,
    );
    expect(screen.getByText('All').className).toContain('bg-white blue-grey');
    expect(screen.getByText('Available for mapping').className).toContain('bg-white blue-grey');
    expect(screen.getByText('Ready for validation').className).toContain('bg-blue-grey white');
    expect(screen.getByText('Unavailable').className).toContain('bg-white blue-grey');
    fireEvent.click(screen.getByText('Unavailable'));
    expect(statusFilter).toBe('unavailable');
  });
  it('Unavailable is active and then click on All', () => {
    render(
      <IntlProvider locale="en">
        <TaskFilter userCanValidate={true} statusFilter={statusFilter} setStatusFn={setStatus} />
      </IntlProvider>,
    );
    expect(screen.getByText('All').className).toContain('bg-white blue-grey');
    expect(screen.getByText('Available for mapping').className).toContain('bg-white blue-grey');
    expect(screen.getByText('Ready for validation').className).toContain('bg-white blue-grey');
    expect(screen.getByText('Unavailable').className).toContain('bg-blue-grey white');
    fireEvent.click(screen.getByText('All'));
    expect(statusFilter).toBe('all');
  });
});

describe('test TaskFilter with userCanValidate FALSE', () => {
  it('render 2 buttons', async () => {
    render(
      <IntlProvider locale="en">
        <TaskFilter userCanValidate={false} statusFilter={'all'} />
      </IntlProvider>,
    );

    expect(screen.getAllByRole('button').length).toBe(2);
    expect(screen.getByText('All').className).toContain('bg-blue-grey white');
    expect(screen.getByText('Available for mapping').className).toContain('bg-white blue-grey');
    expect(screen.queryByText('Ready for validation')).not.toBeInTheDocument();
    expect(screen.queryByText('Unavailable')).not.toBeInTheDocument();
  });
});
