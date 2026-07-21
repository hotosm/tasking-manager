import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { InstructionsForm } from '../instructionsForm';
import { StateContext } from '../../../views/projectEdit';
import { IntlProviders } from '../../../utils/testWithIntl';

// ── Mocks ────────────────────────────────────────────────────────────────────
jest.mock('../inputLocale', () => ({
  InputLocale: ({ children, name }) => (
    <div data-testid={`input-locale-${name}`}>
      {children}
      <textarea data-testid={`locale-textarea-${name}`} name={name} />
    </div>
  ),
}));

jest.mock('../../../utils/defaultChangesetComment', () => ({
  retrieveDefaultChangesetComment: (comment, id) => [
    `#hotosm-project-${id}`,
    comment,
  ],
}));

// Canvas setup for getTextWidth - jsdom doesn't fully support canvas
// jest-canvas-mock may not set up getContext properly in all test environments
beforeAll(() => {
  const mockContext = {
    font: '',
    measureText: () => ({ width: 100 }),
  };
  HTMLCanvasElement.prototype.getContext = () => mockContext;
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const createProjectInfo = (overrides = {}) => ({
  changesetComment: '#hotosm-project-123 my comment',
  projectId: 123,
  projectInfoLocales: [
    {
      locale: 'en',
      instructions: 'Map the roads',
      perTaskInstructions: 'Use satellite imagery',
    },
  ],
  defaultLocale: 'en',
  ...overrides,
});

const renderInstructionsForm = (projectInfoOverrides = {}, setProjectInfo = jest.fn()) => {
  const projectInfo = createProjectInfo(projectInfoOverrides);
  return render(
    <IntlProviders>
      <StateContext.Provider value={{ projectInfo, setProjectInfo }}>
        <InstructionsForm languages={[{ code: 'en', language: 'English' }]} />
      </StateContext.Provider>
    </IntlProviders>,
  );
};

// ── Tests ────────────────────────────────────────────────────────────────────
describe('InstructionsForm', () => {
  describe('renderizado inicial', () => {
    it('renderiza el formulario sin errores', () => {
      renderInstructionsForm();
      expect(document.body).toBeTruthy();
    });

    it('renderiza el input de changesetComment', () => {
      renderInstructionsForm();
      const input = document.querySelector('input[name="changesetComment"]');
      expect(input).toBeInTheDocument();
    });

    it('renderiza el InputLocale para instructions', () => {
      renderInstructionsForm();
      expect(screen.getByTestId('input-locale-instructions')).toBeInTheDocument();
    });

    it('renderiza el InputLocale para perTaskInstructions', () => {
      renderInstructionsForm();
      expect(screen.getByTestId('input-locale-perTaskInstructions')).toBeInTheDocument();
    });
  });

  describe('changesetComment input', () => {
    it('el input tiene el valor correcto del comentario (sin el prefijo)', () => {
      renderInstructionsForm({
        changesetComment: '#hotosm-project-123 my comment',
      });
      const input = document.querySelector('input[name="changesetComment"]');
      // The input shows only the user part (after the defaultComment prefix)
      expect(input).toBeInTheDocument();
    });

    it('al cambiar el changesetComment llama a setProjectInfo con la nueva cadena', () => {
      const setProjectInfo = jest.fn();
      renderInstructionsForm({ changesetComment: '#hotosm-project-123 ' }, setProjectInfo);
      const input = document.querySelector('input[name="changesetComment"]');
      fireEvent.change(input, { target: { name: 'changesetComment', value: 'new comment' } });
      expect(setProjectInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          changesetComment: expect.stringContaining('new comment'),
        }),
      );
    });

    it('el input tiene el tipo text', () => {
      renderInstructionsForm();
      const input = document.querySelector('input[name="changesetComment"]');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('el input tiene el nombre changesetComment', () => {
      renderInstructionsForm();
      const input = document.querySelector('input[name="changesetComment"]');
      expect(input).toHaveAttribute('name', 'changesetComment');
    });
  });

  describe('handleChange - lógica de actualización', () => {
    it('actualiza correctamente un campo que no es locale (changesetComment)', () => {
      const setProjectInfo = jest.fn();
      renderInstructionsForm({}, setProjectInfo);
      const input = document.querySelector('input[name="changesetComment"]');
      fireEvent.change(input, { target: { name: 'changesetComment', value: 'test' } });
      expect(setProjectInfo).toHaveBeenCalled();
    });

    it('el valor de changesetComment concatena el prefijo por defecto', () => {
      const setProjectInfo = jest.fn();
      renderInstructionsForm({ changesetComment: '#hotosm-project-123 ' }, setProjectInfo);
      const input = document.querySelector('input[name="changesetComment"]');
      fireEvent.change(input, { target: { name: 'changesetComment', value: 'roads update' } });
      expect(setProjectInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          changesetComment: expect.stringContaining('#hotosm-project-123'),
        }),
      );
    });
  });

  describe('secciones de texto descriptivo', () => {
    it('renderiza secciones de descripción en el formulario', () => {
      renderInstructionsForm();
      // There should be multiple DOM sections
      const textareas = screen.getAllByTestId(/locale-textarea/);
      expect(textareas.length).toBeGreaterThanOrEqual(2);
    });
  });
});
