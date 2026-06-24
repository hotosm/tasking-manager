import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { SettingsForm } from '../settingsForm';
import { StateContext } from '../../../views/projectEdit';
import { IntlProviders } from '../../../utils/testWithIntl';

// ── Mocks ────────────────────────────────────────────────────────────────────
jest.mock('../../formInputs', () => ({
  SwitchToggle: ({ isChecked, onChange, label }) => (
    <label data-testid="switch-toggle">
      <input
        type="checkbox"
        role="switch"
        checked={!!isChecked}
        onChange={onChange}
        data-testid="switch-input"
      />
      {label}
    </label>
  ),
  CheckBox: ({ activeItems, toggleFn, itemId }) => {
    const isActive = activeItems && activeItems.includes(itemId);
    return (
      <input
        type="checkbox"
        data-testid={`checkbox-${itemId}`}
        checked={!!isActive}
        onChange={() => {
          const newItems = isActive
            ? (activeItems || []).filter((i) => i !== itemId)
            : [...(activeItems || []), itemId];
          toggleFn(newItems);
        }}
      />
    );
  },
}));

// Always return an array - never undefined
jest.mock('../../../utils/editorsList', () => ({
  getEditors: (filter) => {
    if (filter === 'ID') return [{ label: 'iD Editor', value: 'ID' }];
    return [
      { label: 'iD Editor', value: 'ID' },
      { label: 'JOSM', value: 'JOSM' },
      { label: 'RapiD', value: 'RAPID' },
    ];
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────
const createProjectInfo = (overrides = {}) => ({
  mappingEditors: ['ID'],
  validationEditors: ['JOSM'],
  enforceRandomTaskSelection: false,
  rapidPowerUser: false,
  sandbox: false,
  database: 'OSM',
  ...overrides,
});

const renderSettingsForm = (projectInfoOverrides = {}, setProjectInfo = jest.fn()) => {
  const projectInfo = createProjectInfo(projectInfoOverrides);
  return render(
    <IntlProviders>
      <StateContext.Provider value={{ projectInfo, setProjectInfo }}>
        <SettingsForm
          languages={[
            { code: 'en', language: 'English' },
            { code: 'es', language: 'Spanish' },
          ]}
          defaultLocale="en"
        />
      </StateContext.Provider>
    </IntlProviders>,
  );
};

// ── Tests ────────────────────────────────────────────────────────────────────
describe('SettingsForm', () => {
  describe('renderizado inicial', () => {
    it('renderiza el formulario sin errores', () => {
      renderSettingsForm();
      expect(document.body).toBeTruthy();
    });

    it('renderiza el selector de idioma', () => {
      renderSettingsForm();
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('el selector de idioma tiene la opción English', () => {
      renderSettingsForm();
      expect(screen.getByRole('option', { name: /english/i })).toBeInTheDocument();
    });

    it('el selector de idioma tiene la opción Spanish', () => {
      renderSettingsForm();
      expect(screen.getByRole('option', { name: /spanish/i })).toBeInTheDocument();
    });
  });

  describe('editores de mapeo (mapping editors)', () => {
    it('renderiza el checkbox de ID para mapping', () => {
      renderSettingsForm();
      const idCheckboxes = screen.getAllByTestId('checkbox-ID');
      expect(idCheckboxes.length).toBeGreaterThanOrEqual(1);
    });

    it('renderiza el checkbox de JOSM', () => {
      renderSettingsForm();
      expect(screen.getAllByTestId('checkbox-JOSM').length).toBeGreaterThanOrEqual(1);
    });

    it('ID está marcado como editor de mapeo cuando está en mappingEditors', () => {
      renderSettingsForm({ mappingEditors: ['ID'] });
      const idCheckboxes = screen.getAllByTestId('checkbox-ID');
      expect(idCheckboxes[0]).toBeChecked();
    });

    it('JOSM NO está marcado como editor de mapeo cuando no está en la lista', () => {
      renderSettingsForm({ mappingEditors: ['ID'] });
      const josmCheckboxes = screen.getAllByTestId('checkbox-JOSM');
      expect(josmCheckboxes[0]).not.toBeChecked();
    });

    it('al hacer clic en JOSM (mapping) llama a setProjectInfo con los nuevos editores', () => {
      const setProjectInfo = jest.fn();
      renderSettingsForm({ mappingEditors: ['ID'] }, setProjectInfo);
      const josmCheckboxes = screen.getAllByTestId('checkbox-JOSM');
      fireEvent.click(josmCheckboxes[0]);
      expect(setProjectInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          mappingEditors: expect.arrayContaining(['ID', 'JOSM']),
        }),
      );
    });

    it('al desmarcar ID lo elimina de mappingEditors', () => {
      const setProjectInfo = jest.fn();
      renderSettingsForm({ mappingEditors: ['ID', 'JOSM'] }, setProjectInfo);
      const idCheckboxes = screen.getAllByTestId('checkbox-ID');
      fireEvent.click(idCheckboxes[0]);
      expect(setProjectInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          mappingEditors: expect.not.arrayContaining(['ID']),
        }),
      );
    });
  });

  describe('editores de validación (validation editors)', () => {
    it('JOSM está marcado como editor de validación', () => {
      renderSettingsForm({ validationEditors: ['JOSM'] });
      const josmCheckboxes = screen.getAllByTestId('checkbox-JOSM');
      // Second JOSM checkbox = validation editors section
      expect(josmCheckboxes[1]).toBeChecked();
    });

    it('al hacer clic en ID (validation) actualiza validationEditors', () => {
      const setProjectInfo = jest.fn();
      renderSettingsForm({ validationEditors: ['JOSM'] }, setProjectInfo);
      const idCheckboxes = screen.getAllByTestId('checkbox-ID');
      fireEvent.click(idCheckboxes[1]);
      expect(setProjectInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          validationEditors: expect.arrayContaining(['JOSM', 'ID']),
        }),
      );
    });
  });

  describe('enforceRandomTaskSelection toggle', () => {
    it('el switch de selección aleatoria está desmarcado por defecto', () => {
      renderSettingsForm({ enforceRandomTaskSelection: false });
      const switches = screen.getAllByTestId('switch-input');
      expect(switches[0]).not.toBeChecked();
    });

    it('el switch está marcado cuando enforceRandomTaskSelection=true', () => {
      renderSettingsForm({ enforceRandomTaskSelection: true });
      const switches = screen.getAllByTestId('switch-input');
      expect(switches[0]).toBeChecked();
    });

    it('al hacer clic en el switch invierte enforceRandomTaskSelection', () => {
      const setProjectInfo = jest.fn();
      renderSettingsForm({ enforceRandomTaskSelection: false }, setProjectInfo);
      const switches = screen.getAllByTestId('switch-input');
      fireEvent.click(switches[0]);
      expect(setProjectInfo).toHaveBeenCalledWith(
        expect.objectContaining({ enforceRandomTaskSelection: true }),
      );
    });
  });

  describe('RAPID Power User toggle', () => {
    it('NO muestra el toggle de RAPID cuando RAPID no está en ningún editor', () => {
      renderSettingsForm({ mappingEditors: ['ID'], validationEditors: ['JOSM'] });
      const switches = screen.getAllByTestId('switch-input');
      expect(switches.length).toBe(1);
    });

    it('muestra el toggle de RAPID cuando RAPID está en mappingEditors', () => {
      renderSettingsForm({ mappingEditors: ['RAPID'], validationEditors: [] });
      const switches = screen.getAllByTestId('switch-input');
      expect(switches.length).toBe(2);
    });

    it('muestra el toggle de RAPID cuando RAPID está en validationEditors', () => {
      renderSettingsForm({ mappingEditors: [], validationEditors: ['RAPID'] });
      const switches = screen.getAllByTestId('switch-input');
      expect(switches.length).toBe(2);
    });

    it('al hacer clic en el switch de RAPID invierte rapidPowerUser', () => {
      const setProjectInfo = jest.fn();
      renderSettingsForm({ mappingEditors: ['RAPID'], rapidPowerUser: false }, setProjectInfo);
      const switches = screen.getAllByTestId('switch-input');
      fireEvent.click(switches[1]);
      expect(setProjectInfo).toHaveBeenCalledWith(
        expect.objectContaining({ rapidPowerUser: true }),
      );
    });
  });

  describe('selector de idioma por defecto', () => {
    it('al cambiar el idioma llama a setProjectInfo con el nuevo defaultLocale', () => {
      const setProjectInfo = jest.fn();
      renderSettingsForm({}, setProjectInfo);
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'es' } });
      expect(setProjectInfo).toHaveBeenCalledWith(
        expect.objectContaining({ defaultLocale: 'es' }),
      );
    });

    it('el valor actual del selector es "en"', () => {
      renderSettingsForm();
      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('en');
    });
  });

  describe('customEditor', () => {
    it('muestra el nombre del customEditor cuando está definido y en mappingEditors', () => {
      renderSettingsForm({
        customEditor: { name: 'My Custom Editor' },
        mappingEditors: ['CUSTOM'],
      });
      expect(screen.getAllByText(/My Custom Editor/)[0]).toBeInTheDocument();
    });

    it('NO muestra el customEditor cuando no está definido', () => {
      renderSettingsForm({ customEditor: null });
      expect(screen.queryByText(/My Custom Editor/)).toBeNull();
    });
  });

  describe('modo sandbox', () => {
    it('cuando sandbox=true y database no es OSM, solo muestra editor ID', () => {
      renderSettingsForm({
        sandbox: true,
        database: 'sandbox',
        mappingEditors: ['ID'],
        validationEditors: [],
      });
      // In sandbox+non-OSM mode, only ID editor is shown (getEditors('ID'))
      const idCheckboxes = screen.getAllByTestId('checkbox-ID');
      expect(idCheckboxes.length).toBeGreaterThanOrEqual(1);
      // No JOSM checkbox should exist
      expect(screen.queryAllByTestId('checkbox-JOSM').length).toBe(0);
    });
  });
});
