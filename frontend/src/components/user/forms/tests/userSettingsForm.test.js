import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { UserSettingsForm } from '../settings';
import { ReduxIntlProviders } from '../../../../utils/testWithIntl';

// ── Mocks ────────────────────────────────────────────────────────────────────
jest.mock('../customField', () => ({
  CustomField: ({ children, labelId }) => (
    <div data-testid={`custom-field-${labelId}`}>
      <label>{labelId}</label>
      {children}
    </div>
  ),
}));

jest.mock('../switchToggleField', () => ({
  SwitchToggleField: ({ fieldName }) => (
    <input type="checkbox" data-testid={`switch-field-${fieldName}`} />
  ),
}));

jest.mock('../../../localeSelect', () => ({
  LocaleSelector: () => <div data-testid="locale-selector">Locale Selector</div>,
}));

jest.mock('../../../../utils/editorsList', () => ({
  getEditors: () => [
    { label: 'iD Editor', value: 'ID' },
    { label: 'JOSM', value: 'JOSM' },
    { label: 'RapiD', value: 'RAPID' },
  ],
}));

// Mock react-select to avoid issues with Select component in tests
jest.mock('react-select', () => {
  const React = require('react');
  return function MockSelect({ onChange, options, placeholder }) {
    return (
      <div data-testid="editor-select">
        {options && options.map((opt) => (
          <button key={opt.value} onClick={() => onChange(opt)}>
            {opt.label}
          </button>
        ))}
      </div>
    );
  };
});

// ── Helpers ───────────────────────────────────────────────────────────────────
// We render UserSettingsForm inside the real Redux store with a MAPPER user
const renderForm = () => {
  return render(
    <ReduxIntlProviders>
      <UserSettingsForm />
    </ReduxIntlProviders>,
  );
};

// ── Tests ────────────────────────────────────────────────────────────────────
describe('UserSettingsForm', () => {
  describe('renderizado general', () => {
    it('renderiza el formulario de configuración de usuario sin errores', () => {
      renderForm();
      expect(document.body).toBeTruthy();
    });

    it('muestra el campo de expertMode', () => {
      renderForm();
      expect(screen.getByTestId('custom-field-expertMode')).toBeInTheDocument();
    });

    it('muestra el campo de defaultEditor', () => {
      renderForm();
      expect(screen.getByTestId('custom-field-defaultEditor')).toBeInTheDocument();
    });

    it('muestra el campo de language', () => {
      renderForm();
      expect(screen.getByTestId('custom-field-language')).toBeInTheDocument();
    });

    it('el switch toggle de isExpert está presente', () => {
      renderForm();
      expect(screen.getByTestId('switch-field-isExpert')).toBeInTheDocument();
    });

    it('renderiza el LocaleSelector', () => {
      renderForm();
      expect(screen.getByTestId('locale-selector')).toBeInTheDocument();
    });

    it('renderiza el editor select dropdown', () => {
      renderForm();
      expect(screen.getByTestId('editor-select')).toBeInTheDocument();
    });

    it('el select de editores muestra las opciones de editores', () => {
      renderForm();
      expect(screen.getByText('iD Editor')).toBeInTheDocument();
      expect(screen.getByText('JOSM')).toBeInTheDocument();
    });
  });

  // Note: The becomeValidator section is shown when userDetails.role === 'MAPPER'.
  // The real store starts with an unauthenticated state (no userDetails.role set),
  // so this button won't appear without pre-populating the store.
  describe('estructura del formulario', () => {
    it('el formulario está contenido en un div con clase bg-white', () => {
      renderForm();
      const container = document.querySelector('.bg-white');
      expect(container).toBeInTheDocument();
    });

    it('muestra el título de Settings', () => {
      renderForm();
      // The h3 tag contains a FormattedMessage for 'settings'
      const heading = document.querySelector('h3');
      expect(heading).toBeInTheDocument();
    });
  });
});
