import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { LocaleOption } from '../localeOption';
import userEvent from '@testing-library/user-event';

describe('LocaleOption', () => {
  const mockFn = jest.fn();
  it('with isActive = true', async () => {
    const user = userEvent.setup();
    render(
      <LocaleOption
        localeCode={'es'}
        name="Español"
        isActive={true}
        hasValue={true}
        onClick={mockFn}
      />,
    );
    expect(screen.getByText('es').className).toContain(
      'ba b--grey-light br1 ph2 mb2 pv1 f7 mr2 pointer',
    );
    expect(screen.getByText('es').className).toContain('bg-blue-grey fw6 white');
    expect(screen.getByText('es').title).toBe('Español');
    await user.click(screen.getByText('es'));
    expect(mockFn).toHaveBeenCalledWith('es');
  });
  it('with isActive = false and hasValue = true', () => {
    render(
      <LocaleOption
        localeCode={'pt'}
        name="Português"
        isActive={false}
        hasValue={true}
        onClick={mockFn}
      />,
    );
    expect(screen.getByText('pt').className).toContain(
      'ba b--grey-light br1 ph2 mb2 pv1 f7 mr2 pointer',
    );
    expect(screen.getByText('pt').className).toContain('bg-white fw6 blue-dark');
    expect(screen.getByText('pt').title).toBe('Português');
  });
  it('with isActive = false and hasValue = false', () => {
    render(
      <LocaleOption
        localeCode={'it'}
        name="Italiano"
        isActive={false}
        hasValue={false}
        onClick={mockFn}
      />,
    );
    expect(screen.getByText('it').className).toContain(
      'ba b--grey-light br1 ph2 mb2 pv1 f7 mr2 pointer',
    );
    expect(screen.getByText('it').className).toContain('bg-white blue-grey');
    expect(screen.getByText('it').title).toBe('Italiano');
  });
});
