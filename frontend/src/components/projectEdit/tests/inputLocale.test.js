import React from 'react';
import '@testing-library/jest-dom';
import { screen, act, waitFor, fireEvent } from '@testing-library/react';

import { InputLocale } from '../inputLocale';
import { StateContext } from '../../../views/projectEdit';
import { IntlProviders } from '../../../utils/testWithIntl';
import { render } from '@testing-library/react';

const mockLanguages = [
  { code: 'en', language: 'English' },
  { code: 'es', language: 'Spanish' },
  { code: 'fr', language: 'French' }
];

const mockProjectInfo = {
  defaultLocale: 'en',
  projectInfoLocales: [
    {
      locale: 'en',
      name: 'Test Project',
      description: 'Default desc'
    },
    {
      locale: 'es',
      name: 'Proyecto de prueba'
    }
  ]
};

const setup = (props = {}, projectInfoOverride = {}) => {
  const setProjectInfo = jest.fn();
  const setSuccess = jest.fn();
  const setError = jest.fn();

  const contextValue = {
    projectInfo: { ...mockProjectInfo, ...projectInfoOverride },
    setProjectInfo,
    setSuccess,
    setError,
  };

  const utils = render(
    <IntlProviders>
      <StateContext.Provider value={contextValue}>
        <InputLocale name="name" type="text" maxLength={100} languages={mockLanguages} {...props}>
          <div data-testid="child-element">Child Content</div>
        </InputLocale>
      </StateContext.Provider>
    </IntlProviders>
  );

  return { ...utils, setProjectInfo, setSuccess, setError, contextValue };
};

describe('InputLocale', () => {
  it('renders children and default language label', () => {
    setup();
    expect(screen.getByTestId('child-element')).toBeInTheDocument();
    expect(screen.getByText(/Language - English/i)).toBeInTheDocument();
  });

  it('renders available translation tabs', () => {
    setup();
    expect(screen.getByTitle(/Spanish/i)).toBeInTheDocument();
    expect(screen.getByTitle(/French/i)).toBeInTheDocument();
  });

  it('initially selects the first available translated locale', async () => {
    setup();
    const esInput = screen.getAllByRole('textbox')[1]; // second textbox is the translated one
    expect(esInput.value).toBe('Proyecto de prueba');
  });

  it('switches to a different locale when translation tab is clicked', async () => {
    setup();
    const frTab = screen.getByTitle(/French/i);
    act(() => {
      fireEvent.click(frTab);
    });
    
    // In 'fr' there is no value yet
    const frInput = screen.getAllByRole('textbox')[1];
    expect(frInput.value).toBe('');
  });

  it('updates projectInfo state on blur of default locale input', async () => {
    const { setProjectInfo } = setup();
    const inputs = screen.getAllByRole('textbox');
    const defaultInput = inputs[0];

    act(() => {
      fireEvent.change(defaultInput, { target: { value: 'New EN Name' } });
    });
    act(() => {
      fireEvent.blur(defaultInput);
    });

    expect(setProjectInfo).toHaveBeenCalled();
    const callArgs = setProjectInfo.mock.calls[0][0];
    const enLocale = callArgs.projectInfoLocales.find(l => l.locale === 'en');
    expect(enLocale.name).toBe('New EN Name');
  });

  it('updates projectInfo state on blur of translation locale input', async () => {
    const { setProjectInfo } = setup();
    const inputs = screen.getAllByRole('textbox');
    const esInput = inputs[1];

    act(() => {
      fireEvent.change(esInput, { target: { value: 'Nuevo Nombre' } });
    });
    act(() => {
      fireEvent.blur(esInput);
    });

    expect(setProjectInfo).toHaveBeenCalled();
    const callArgs = setProjectInfo.mock.calls[0][0];
    const esLocale = callArgs.projectInfoLocales.find(l => l.locale === 'es');
    expect(esLocale.name).toBe('Nuevo Nombre');
  });

  it('clears success and error states on input change', async () => {
    const { setSuccess, setError } = setup();
    const defaultInput = screen.getAllByRole('textbox')[0];

    act(() => {
      fireEvent.change(defaultInput, { target: { value: 'Changed' } });
    });

    expect(setSuccess).toHaveBeenCalledWith(false);
    expect(setError).toHaveBeenCalledWith(null);
  });
});
