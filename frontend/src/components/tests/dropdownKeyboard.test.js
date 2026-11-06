import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

import { IntlProviders } from '../../utils/testWithIntl';
import { Dropdown } from '../dropdown';

const options = [
  { label: 'Most recent', value: 'recent' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Priority', value: 'priority' },
];

const renderDropdown = (props = {}) => {
  const onChange = jest.fn();
  render(
    <MemoryRouter>
      <IntlProviders>
        <Dropdown
          options={options}
          value="oldest"
          display="Sort by"
          onChange={onChange}
          {...props}
        />
      </IntlProviders>
    </MemoryRouter>,
  );
  // the menu is closed, so the trigger is the only button
  return { onChange, trigger: screen.getByRole('button') };
};

describe('Dropdown keyboard support', () => {
  it('trigger reports its popup state and is not a toggle button', () => {
    const { trigger } = renderDropdown();
    expect(trigger).toHaveTextContent('Oldest');
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).not.toHaveAttribute('aria-pressed');
    expect(trigger).not.toHaveAttribute('focusindex');
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('ArrowDown and ArrowUp on the closed trigger open the menu', () => {
    const { trigger } = renderDropdown();
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.keyDown(screen.getAllByRole('menuitem')[0], { key: 'Escape' });
    fireEvent.keyDown(trigger, { key: 'ArrowUp' });
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('opening focuses the selected option and arrows wrap', () => {
    const { trigger } = renderDropdown();
    fireEvent.click(trigger);
    const items = screen.getAllByRole('menuitem');
    expect(items).toHaveLength(3);
    items.forEach((item) => expect(item).toHaveAttribute('tabindex', '-1'));
    expect(items[1]).toHaveFocus();
    fireEvent.keyDown(items[1], { key: 'ArrowDown' });
    expect(items[2]).toHaveFocus();
    fireEvent.keyDown(items[2], { key: 'ArrowDown' });
    expect(items[0]).toHaveFocus();
    fireEvent.keyDown(items[0], { key: 'ArrowUp' });
    expect(items[2]).toHaveFocus();
  });

  it('opening focuses the first option when nothing is selected', () => {
    const { trigger } = renderDropdown({ value: undefined });
    expect(trigger).toHaveTextContent('Sort by');
    fireEvent.click(trigger);
    expect(screen.getAllByRole('menuitem')[0]).toHaveFocus();
  });

  it('Home and End jump to the first and last options', () => {
    const { trigger } = renderDropdown();
    fireEvent.click(trigger);
    const items = screen.getAllByRole('menuitem');
    fireEvent.keyDown(items[1], { key: 'End' });
    expect(items[2]).toHaveFocus();
    fireEvent.keyDown(items[2], { key: 'Home' });
    expect(items[0]).toHaveFocus();
  });

  it.each(['Enter', ' '])('"%s" selects, closes and returns focus to the trigger', (key) => {
    const { trigger, onChange } = renderDropdown();
    fireEvent.click(trigger);
    const items = screen.getAllByRole('menuitem');
    fireEvent.keyDown(items[1], { key: 'ArrowDown' });
    fireEvent.keyDown(items[2], { key });
    expect(onChange).toHaveBeenCalledWith([options[2]]);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('Escape closes without selecting and returns focus to the trigger', () => {
    const { trigger, onChange } = renderDropdown();
    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getAllByRole('menuitem')[0], { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('Tab closes the menu', () => {
    const { trigger, onChange } = renderDropdown();
    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getAllByRole('menuitem')[0], { key: 'Tab' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('mouse selection still works as before', () => {
    const { trigger, onChange } = renderDropdown();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByText('Priority'));
    expect(onChange).toHaveBeenCalledWith([options[2]]);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('multi mode exposes checkable items and stays open on Enter', () => {
    const onChange = jest.fn();
    render(
      <MemoryRouter>
        <IntlProviders>
          <Dropdown
            multi
            options={options}
            value={[options[0]]}
            display="Filters"
            onChange={onChange}
          />
        </IntlProviders>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Filters/ }));
    const items = screen.getAllByRole('menuitemcheckbox');
    expect(items).toHaveLength(3);
    items.forEach((item) => expect(item).toHaveAttribute('aria-checked'));
    const checkbox = items[0].querySelector('input[type="checkbox"]');
    expect(checkbox).toHaveAttribute('tabindex', '-1');
    expect(checkbox).toHaveAttribute('aria-hidden', 'true');
    fireEvent.keyDown(items[1], { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith([options[0], options[1]]);
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('external link options make the <a> the menu item', () => {
    render(
      <MemoryRouter>
        <IntlProviders>
          <Dropdown
            options={[
              { label: 'A', href: 'https://a.example' },
              { label: 'B', href: 'https://b.example' },
            ]}
            display="Links"
          />
        </IntlProviders>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Links/ }));
    const items = screen.getAllByRole('menuitem');
    expect(items).toHaveLength(2);
    expect(items[0].tagName).toBe('A');
    expect(items[0]).toHaveAttribute('href', 'https://a.example');
    expect(items[0].parentElement).toHaveAttribute('role', 'none');
    expect(items[0]).toHaveFocus();
  });

  it('Delete removes a deletable option; the "x" has an accessible name', () => {
    const deletable = jest.fn();
    const { trigger } = renderDropdown({ deletable });
    fireEvent.click(trigger);
    expect(screen.getAllByRole('button', { name: 'Remove' })).toHaveLength(3);
    fireEvent.keyDown(screen.getAllByRole('menuitem')[2], { key: 'Delete' });
    expect(deletable).toHaveBeenCalledWith('priority');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
