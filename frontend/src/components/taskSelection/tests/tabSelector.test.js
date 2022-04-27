import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import { TabSelector } from '../tabSelector';

describe('TabSelector component', () => {
  const setActiveSection = jest.fn();
  it('with the tasks tab active', () => {
    const { container } = render(
      <ReduxIntlProviders>
        <TabSelector activeSection={'tasks'} setActiveSection={setActiveSection} />
      </ReduxIntlProviders>,
    );
    expect(container.querySelector('div').className).toBe(
      'cf ttu barlow-condensed f4 pv2 blue-dark',
    );
    expect(screen.getByText('Tasks').className).toBe('mr4 pb1 pointer bb bw1 b--blue-dark');
    expect(screen.getByText('Instructions').className).not.toContain('bb bw1 b--blue-dark');
    expect(screen.getByText('contributions').className).not.toContain('bb bw1 b--blue-dark');
    fireEvent.click(screen.getByText('Instructions'));
    expect(setActiveSection).toHaveBeenCalledWith('instructions');
  });
  it('with the instructions tab active', () => {
    render(
      <ReduxIntlProviders>
        <TabSelector activeSection={'instructions'} setActiveSection={setActiveSection} />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('Tasks').className).not.toContain('bb bw1 b--blue-dark');
    expect(screen.getByText('Instructions').className).toContain('bb bw1 b--blue-dark');
    expect(screen.getByText('contributions').className).not.toContain('bb bw1 b--blue-dark');
    fireEvent.click(screen.getByText('contributions'));
    expect(setActiveSection).toHaveBeenLastCalledWith('contributions');
  });
  it('with the contributions tab active', () => {
    render(
      <ReduxIntlProviders>
        <TabSelector activeSection={'contributions'} setActiveSection={setActiveSection} />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('Tasks').className).not.toContain('bb bw1 b--blue-dark');
    expect(screen.getByText('Instructions').className).not.toContain('bb bw1 b--blue-dark');
    expect(screen.getByText('contributions').className).toContain('bb bw1 b--blue-dark');
    fireEvent.click(screen.getByText('Tasks'));
    expect(setActiveSection).toHaveBeenLastCalledWith('tasks');
  });
});
