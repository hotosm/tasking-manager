import '@testing-library/jest-dom';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import { TabSelector } from '../tabSelector';
import { store } from '../../../store';

describe('TabSelector component', () => {
  const setActiveSection = jest.fn();
  const user = userEvent.setup();

  act(() => {
    store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
  });

  it('with the tasks tab active', async () => {
    const { container } = render(
      <ReduxIntlProviders>
        <TabSelector activeSection={'tasks'} setActiveSection={setActiveSection} />
      </ReduxIntlProviders>,
    );
    expect(container.querySelector('div').className).toBe(
      'ttu barlow-condensed f4 blue-dark bb b--grey-light',
    );
    expect(screen.getByText('Tasks').className).toBe('mr4 pb2 fw5 pointer dib bb bw1');
    expect(screen.getByText('Instructions').className).not.toContain('bb bw1 b--blue-dark');
    expect(screen.getByText('contributions').className).not.toContain('bb bw1 b--blue-dark');
    await user.click(screen.getByText('Instructions'));
    expect(setActiveSection).toHaveBeenCalledWith('instructions');
  });

  it('with the instructions tab active', async () => {
    render(
      <ReduxIntlProviders>
        <TabSelector activeSection={'instructions'} setActiveSection={setActiveSection} />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('Tasks').className).not.toContain('bb bw1 b--blue-dark');
    expect(screen.getByText('Instructions').className).toContain('mr4 pb2 fw5 pointer dib bb bw1');
    expect(screen.getByText('contributions').className).not.toContain('bb bw1 b--blue-dark');
    await user.click(screen.getByText('contributions'));
    expect(setActiveSection).toHaveBeenLastCalledWith('contributions');
  });

  it('with the contributions tab active', async () => {
    render(
      <ReduxIntlProviders>
        <TabSelector activeSection={'contributions'} setActiveSection={setActiveSection} />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('Tasks').className).not.toContain('bb bw1 b--blue-dark');
    expect(screen.getByText('Instructions').className).not.toContain('bb bw1 b--blue-dark');
    expect(screen.getByText('contributions').className).toContain('mr4 pb2 fw5 pointer dib bb bw1');
    await user.click(screen.getByText('Tasks'));
    expect(setActiveSection).toHaveBeenLastCalledWith('tasks');
  });
});
