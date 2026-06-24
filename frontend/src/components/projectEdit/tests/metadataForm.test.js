import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';

import { MetadataForm } from '../metadataForm';
import { StateContext } from '../../../views/projectEdit';
import { ReduxIntlProviders } from '../../../utils/testWithIntl';

// ── Mocks ────────────────────────────────────────────────────────────────────
jest.mock('../../../network/genericJSONRequest', () => ({
  fetchLocalJSONAPI: () =>
    Promise.resolve({ organisations: [], campaigns: [], interests: [] }),
}));

jest.mock('../projectInterests', () => ({
  ProjectInterests: ({ interests }) => (
    <div data-testid="project-interests">
      {(interests || []).map((i) => <span key={i.id}>{i.name}</span>)}
    </div>
  ),
}));

jest.mock('../extraIdParams', () => ({
  ExtraIdParams: ({ value }) => (
    <input data-testid="extra-id-params" type="hidden" defaultValue={value} />
  ),
}));

jest.mock('../../code', () => ({
  Code: ({ children }) => <code data-testid="code-block">{children}</code>,
}));

jest.mock('../../formInputs', () => ({
  CheckBox: ({ activeItems, toggleFn, itemId }) => {
    const isActive = activeItems && activeItems.includes(itemId);
    return (
      <input
        type="checkbox"
        data-testid={`checkbox-${itemId}`}
        checked={!!isActive}
        onChange={() => {
          const newItems = isActive
            ? activeItems.filter((i) => i !== itemId)
            : [...(activeItems || []), itemId];
          toggleFn(newItems);
        }}
      />
    );
  },
}));

jest.mock('../../../config/presets', () => ({
  ID_PRESETS: {
    buildings: { name: 'Buildings', members: ['building', 'building:levels'] },
    roads: { name: 'Roads', members: ['highway', 'surface'] },
  },
}));

jest.mock('../../../utils/osmchaLink', () => ({
  getFilterId: (v) => v,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────
const createProjectInfo = (overrides = {}) => ({
  difficulty: 'MODERATE',
  mappingTypes: ['ROADS'],
  validationEditors: [],
  mappingEditors: [],
  idPresets: [],
  organisation: 1,
  organisationName: 'HOT',
  campaigns: [],
  interests: [],
  osmchaFilterId: '',
  extraIdParams: '',
  ...overrides,
});

const renderMetadataForm = async (projectInfoOverrides = {}, setProjectInfo = jest.fn()) => {
  const projectInfo = createProjectInfo(projectInfoOverrides);
  let result;
  await act(async () => {
    result = render(
      <ReduxIntlProviders>
        <StateContext.Provider value={{ projectInfo, setProjectInfo }}>
          <MetadataForm />
        </StateContext.Provider>
      </ReduxIntlProviders>,
    );
  });
  return result;
};

// ── Tests ────────────────────────────────────────────────────────────────────
describe('MetadataForm', () => {
  describe('renderizado inicial', () => {
    it('renderiza el formulario sin errores', async () => {
      await renderMetadataForm();
      expect(document.body).toBeTruthy();
    });

    it('renderiza los checkboxes de mapping types', async () => {
      await renderMetadataForm();
      expect(screen.getByTestId('checkbox-ROADS')).toBeInTheDocument();
    });

    it('renderiza el checkbox de BUILDINGS', async () => {
      await renderMetadataForm();
      expect(screen.getByTestId('checkbox-BUILDINGS')).toBeInTheDocument();
    });

    it('renderiza el checkbox de WATERWAYS', async () => {
      await renderMetadataForm();
      expect(screen.getByTestId('checkbox-WATERWAYS')).toBeInTheDocument();
    });

    it('renderiza el checkbox de LAND_USE', async () => {
      await renderMetadataForm();
      expect(screen.getByTestId('checkbox-LAND_USE')).toBeInTheDocument();
    });

    it('renderiza el checkbox de OTHER', async () => {
      await renderMetadataForm();
      expect(screen.getByTestId('checkbox-OTHER')).toBeInTheDocument();
    });

    it('renderiza el componente ProjectInterests', async () => {
      await renderMetadataForm();
      expect(screen.getByTestId('project-interests')).toBeInTheDocument();
    });

    it('renderiza el campo ExtraIdParams', async () => {
      await renderMetadataForm();
      expect(screen.getByTestId('extra-id-params')).toBeInTheDocument();
    });

    it('renderiza el input de osmchaFilterId', async () => {
      await renderMetadataForm();
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('name', 'osmchaFilterId');
    });
  });

  describe('dificultad del proyecto', () => {
    it('renderiza los tres niveles de dificultad', async () => {
      await renderMetadataForm();
      const radios = screen.getAllByRole('radio');
      const difficulties = ['EASY', 'MODERATE', 'CHALLENGING'];
      difficulties.forEach((d) => {
        const radio = radios.find((r) => r.value === d);
        expect(radio).toBeInTheDocument();
      });
    });

    it('MODERATE está marcado cuando difficulty=MODERATE', async () => {
      await renderMetadataForm({ difficulty: 'MODERATE' });
      const radios = screen.getAllByRole('radio');
      const moderate = radios.find((r) => r.value === 'MODERATE');
      expect(moderate).toBeChecked();
    });

    it('EASY está marcado cuando difficulty=EASY', async () => {
      await renderMetadataForm({ difficulty: 'EASY' });
      const radios = screen.getAllByRole('radio');
      const easy = radios.find((r) => r.value === 'EASY');
      expect(easy).toBeChecked();
    });

    it('al hacer clic en CHALLENGING llama a setProjectInfo con difficulty CHALLENGING', async () => {
      const setProjectInfo = jest.fn();
      await renderMetadataForm({ difficulty: 'EASY' }, setProjectInfo);
      const radios = screen.getAllByRole('radio');
      const challenging = radios.find((r) => r.value === 'CHALLENGING');
      fireEvent.click(challenging);
      expect(setProjectInfo).toHaveBeenCalledWith(
        expect.objectContaining({ difficulty: 'CHALLENGING' }),
      );
    });
  });

  describe('mapping types checkboxes', () => {
    it('ROADS está marcado cuando está en mappingTypes', async () => {
      await renderMetadataForm({ mappingTypes: ['ROADS'] });
      expect(screen.getByTestId('checkbox-ROADS')).toBeChecked();
    });

    it('BUILDINGS NO está marcado cuando no está en mappingTypes', async () => {
      await renderMetadataForm({ mappingTypes: ['ROADS'] });
      expect(screen.getByTestId('checkbox-BUILDINGS')).not.toBeChecked();
    });

    it('al hacer clic en BUILDINGS llama a setProjectInfo con los nuevos tipos', async () => {
      const setProjectInfo = jest.fn();
      await renderMetadataForm({ mappingTypes: ['ROADS'] }, setProjectInfo);
      fireEvent.click(screen.getByTestId('checkbox-BUILDINGS'));
      expect(setProjectInfo).toHaveBeenCalledWith(
        expect.objectContaining({ mappingTypes: expect.arrayContaining(['ROADS', 'BUILDINGS']) }),
      );
    });

    it('al desmarcar ROADS lo elimina de mappingTypes', async () => {
      const setProjectInfo = jest.fn();
      await renderMetadataForm({ mappingTypes: ['ROADS', 'BUILDINGS'] }, setProjectInfo);
      fireEvent.click(screen.getByTestId('checkbox-ROADS'));
      expect(setProjectInfo).toHaveBeenCalledWith(
        expect.objectContaining({ mappingTypes: expect.not.arrayContaining(['ROADS']) }),
      );
    });
  });

  describe('osmchaFilterId input', () => {
    it('el input de osmchaFilterId tiene el valor inicial correcto', async () => {
      await renderMetadataForm({ osmchaFilterId: 'abc123' });
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('abc123');
    });

    it('al cambiar el valor de osmchaFilterId llama a setProjectInfo', async () => {
      const setProjectInfo = jest.fn();
      await renderMetadataForm({}, setProjectInfo);
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'newfilter' } });
      expect(setProjectInfo).toHaveBeenCalledWith(
        expect.objectContaining({ osmchaFilterId: 'newfilter' }),
      );
    });
  });

  describe('carga de datos remotos (useEffect)', () => {
    it('carga datos correctamente al montar sin errores', async () => {
      const { container } = await renderMetadataForm();
      expect(container).toBeTruthy();
    });
  });
});
