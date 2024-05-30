import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import { ActionTabsNav } from '../actionTabsNav';
import userEvent from '@testing-library/user-event';

describe('ActionTabsNav', () => {
  const setActiveSection = jest.fn();
  const historyTabSwitch = jest.fn();

  it('for mapping does not show the Resouces tab', async () => {
    const user = userEvent.setup();
    render(
      <ReduxIntlProviders>
        <ActionTabsNav
          activeSection={'completion'}
          setActiveSection={setActiveSection}
          activeTasks={[1]}
          historyTabSwitch={historyTabSwitch}
          taskHistoryLength={3}
          action={'MAPPING'}
        />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('Completion').className).toContain(
      'dib mr4-l mr3 pb2 pointer bb b--red bw1',
    );
    expect(screen.getByText('Instructions').className).not.toContain(
      'dib mr4-l mr3 pb2 pointer bb b--red bw1',
    );
    expect(screen.getByText('History').className).not.toContain(
      'dib mr4-l mr3 pb2 pointer bb b--red bw1',
    );
    expect(screen.getByText('3').className).toBe(
      'bg-red white br-100 f6 ml1 flex items-center justify-center',
    );
    expect(screen.queryByText('Resources')).not.toBeInTheDocument();
    await user.click(screen.getByText('Instructions'));
    expect(setActiveSection).toHaveBeenLastCalledWith('instructions');
  });

  it('for mapping with 0 history items', async () => {
    render(
      <ReduxIntlProviders>
        <ActionTabsNav
          activeSection={'completion'}
          setActiveSection={setActiveSection}
          activeTasks={[1]}
          historyTabSwitch={historyTabSwitch}
          taskHistoryLength={0}
          action={'MAPPING'}
        />
      </ReduxIntlProviders>,
    );
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('for mapping with 1 history item', async () => {
    render(
      <ReduxIntlProviders>
        <ActionTabsNav
          activeSection={'completion'}
          setActiveSection={setActiveSection}
          activeTasks={[1]}
          historyTabSwitch={historyTabSwitch}
          taskHistoryLength={1}
          action={'MAPPING'}
        />
      </ReduxIntlProviders>,
    );
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('for validation show the Resouces tab', async () => {
    const user = userEvent.setup();
    render(
      <ReduxIntlProviders>
        <ActionTabsNav
          activeSection={'resources'}
          setActiveSection={setActiveSection}
          activeTasks={[1, 2]}
          historyTabSwitch={historyTabSwitch}
          taskHistoryLength={4}
          action={'VALIDATION'}
        />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('Completion').className).not.toContain('bb b--blue-dark');
    expect(screen.getByText('Instructions').className).not.toContain('bb b--blue-dark');
    expect(screen.getByText('History').className).not.toContain('bb b--blue-dark');
    expect(screen.queryByText('4')).not.toBeInTheDocument();
    expect(screen.getByText('Resources').className).toContain(
      'dib mr4-l mr3 pb2 pointer bb b--red bw1',
    );
    await user.click(screen.getByText('History'));
    expect(historyTabSwitch).toHaveBeenCalled();
    await user.click(screen.getByText('Completion'));
    expect(setActiveSection).toHaveBeenLastCalledWith('completion');
    await user.click(screen.getByText('Resources'));
    expect(setActiveSection).toHaveBeenLastCalledWith('resources');
  });
});
