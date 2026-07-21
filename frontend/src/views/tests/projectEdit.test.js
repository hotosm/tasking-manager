import '@testing-library/jest-dom';
import { act, screen, waitFor, fireEvent } from '@testing-library/react';

import { store } from '../../store';
import {
  ProjectEdit,
  styleClasses,
  handleCheckButton,
  StateContext,
} from '../projectEdit';
import {
  createComponentWithMemoryRouter,
  ReduxIntlProviders,
} from '../../utils/testWithIntl';
import { useFetch } from '../../hooks/UseFetch';
import { useEditProjectAllowed } from '../../hooks/UsePermissions';
import { fetchLocalJSONAPI, pushToLocalJSONAPI } from '../../network/genericJSONRequest';

// ─── Mocks ──────────────────────────────────────────────────────────────────

jest.mock('../../hooks/UseFetch', () => ({ useFetch: jest.fn() }));
jest.mock('../../hooks/UsePermissions', () => ({ useEditProjectAllowed: jest.fn() }));
jest.mock('../../network/genericJSONRequest', () => ({
  fetchLocalJSONAPI: jest.fn(),
  pushToLocalJSONAPI: jest.fn(),
}));

// Mock all heavy form sub-components to isolate view logic
jest.mock('../../components/projectEdit/descriptionForm', () => ({
  DescriptionForm: () => <div data-testid="description-form" />,
}));
jest.mock('../../components/projectEdit/instructionsForm', () => ({
  InstructionsForm: () => <div data-testid="instructions-form" />,
}));
jest.mock('../../components/projectEdit/metadataForm', () => ({
  MetadataForm: () => <div data-testid="metadata-form" />,
}));
jest.mock('../../components/projectEdit/priorityAreasForm', () => ({
  PriorityAreasForm: () => <div data-testid="priority-areas-form" />,
}));
jest.mock('../../components/projectEdit/imageryForm', () => ({
  ImageryForm: () => <div data-testid="imagery-form" />,
}));
jest.mock('../../components/projectEdit/permissionsForm', () => ({
  PermissionsForm: () => <div data-testid="permissions-form" />,
}));
jest.mock('../../components/projectEdit/settingsForm', () => ({
  SettingsForm: () => <div data-testid="settings-form" />,
}));
jest.mock('../../components/projectEdit/actionsForm', () => ({
  ActionsForm: () => <div data-testid="actions-form" />,
}));
jest.mock('../../components/projectEdit/customEditorForm', () => ({
  CustomEditorForm: () => <div data-testid="custom-editor-form" />,
}));
jest.mock('../../components/projectEdit/partnersForm', () => ({
  PartnersForm: () => <div data-testid="project-partners-form" />,
}));
jest.mock('../../components/alert', () => ({
  Alert: ({ children, type }) => (
    <div data-testid={`alert-${type}`}>{children}</div>
  ),
}));
jest.mock('../../components/dropdown', () => ({
  Dropdown: ({ display, options }) => (
    <div data-testid="dropdown">
      <span>{display}</span>
      {options?.map((o, i) => (
        <a key={i} href={o.href}>
          {o.label}
        </a>
      ))}
    </div>
  ),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockProjectInfo = {
  projectId: 42,
  defaultLocale: 'en',
  mappingTypes: ['ROADS'],
  mappingEditors: ['ID'],
  validationEditors: ['ID'],
  organisation: 10,
  teams: [],
  mappingPermission: 'ANY',
  validationPermission: 'ANY',
  projectInfo: { name: 'Test Project' },
  projectInfoLocales: [
    {
      locale: 'en',
      name: 'Test Project',
      shortDescription: 'Short desc',
      description: 'Full description',
      instructions: 'Map roads',
      perTaskInstructions: '',
    },
  ],
  rapidPowerUser: false,
};

const mockLanguages = { supportedLanguages: [{ code: 'en', language: 'English' }] };

const setUpStore = ({ role = 'ADMIN' } = {}) => {
  act(() => {
    store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
    store.dispatch({
      type: 'SET_USER_DETAILS',
      userDetails: { id: 1, username: 'admin', role },
    });
  });
};

const setup = ({ role = 'ADMIN', allowed = true, project = mockProjectInfo } = {}) => {
  useFetch.mockReturnValue([null, false, mockLanguages]);
  useEditProjectAllowed.mockReturnValue([allowed]);
  fetchLocalJSONAPI.mockResolvedValue(project);
  setUpStore({ role });

  return createComponentWithMemoryRouter(
    <ReduxIntlProviders>
      <ProjectEdit />
    </ReduxIntlProviders>,
    { route: '/manage/projects/:id/edit', entryRoute: '/manage/projects/42/edit' },
  );
};

// ─── styleClasses export ─────────────────────────────────────────────────────

describe('styleClasses', () => {
  it('exports a divClass string', () => {
    expect(typeof styleClasses.divClass).toBe('string');
    expect(styleClasses.divClass).toContain('w-70-l');
  });

  it('exports a labelClass string', () => {
    expect(typeof styleClasses.labelClass).toBe('string');
    expect(styleClasses.labelClass).toContain('fw6');
  });

  it('exports a buttonClass string', () => {
    expect(typeof styleClasses.buttonClass).toBe('string');
    expect(styleClasses.buttonClass).toContain('bg-blue-dark');
  });

  it('exports a redButtonClass string', () => {
    expect(styleClasses.redButtonClass).toBe('bg-red white');
  });
});

// ─── handleCheckButton ────────────────────────────────────────────────────────

describe('handleCheckButton', () => {
  it('adds the value to the array when checkbox is checked', () => {
    const event = { target: { checked: true, value: 'ROADS' } };
    const result = handleCheckButton(event, []);
    expect(result).toContain('ROADS');
  });

  it('keeps existing values when adding a new one', () => {
    const event = { target: { checked: true, value: 'BUILDINGS' } };
    const result = handleCheckButton(event, ['ROADS']);
    expect(result).toContain('ROADS');
    expect(result).toContain('BUILDINGS');
  });

  it('removes the value from the array when checkbox is unchecked', () => {
    const event = { target: { checked: false, value: 'ROADS' } };
    const result = handleCheckButton(event, ['ROADS', 'BUILDINGS']);
    expect(result).not.toContain('ROADS');
    expect(result).toContain('BUILDINGS');
  });

  it('returns the original array unchanged when value is not in it and unchecked', () => {
    const event = { target: { checked: false, value: 'WATERWAYS' } };
    const result = handleCheckButton(event, ['ROADS', 'BUILDINGS']);
    expect(result).toEqual(['ROADS', 'BUILDINGS']);
  });
});

// ─── ProjectEdit component ────────────────────────────────────────────────────

describe('ProjectEdit view', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders the Edit Project heading', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /edit project/i })).toBeInTheDocument();
    });
  });

  it('renders the Save button', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });
  });

  it('renders the navigation dropdown', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByTestId('dropdown')).toBeInTheDocument();
    });
  });

  it('renders DescriptionForm by default (description tab)', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByTestId('description-form')).toBeInTheDocument();
    });
  });

  it('renders sidebar menu items including required markers', async () => {
    setup();
    await waitFor(() => {
      // Description, Instructions, Metadata are required fields (marked with *)
      expect(screen.getByText(/description/i)).toBeInTheDocument();
    });
  });

  it('renders "not allowed" message when user cannot edit the project', async () => {
    setup({ allowed: false });
    await waitFor(() => {
      // projectEditNotAllowed message is shown
      expect(
        screen.getByRole('heading', {
          name: /not allowed|no permission/i,
        }),
      ).toBeInTheDocument();
    });
  });

  it('does NOT include partners menu item for non-admin users', async () => {
    setup({ role: 'MAPPER' });
    await waitFor(() => {
      // partners option is only inserted for ADMIN role
      const listItems = screen.queryAllByRole('listitem');
      const partnerItem = listItems.find((li) =>
        li.textContent.toLowerCase().includes('partner'),
      );
      expect(partnerItem).toBeUndefined();
    });
  });

  it('includes partners menu item for ADMIN users', async () => {
    setup({ role: 'ADMIN' });
    await waitFor(() => {
      const listItems = screen.getAllByRole('listitem');
      const partnerItem = listItems.find((li) =>
        li.textContent.toLowerCase().includes('partner'),
      );
      expect(partnerItem).toBeDefined();
    });
  });

  it('switches to InstructionsForm when instructions menu item is clicked', async () => {
    setup();
    await waitFor(() => screen.getByTestId('description-form'));

    const listItems = screen.getAllByRole('listitem');
    const instructionsItem = listItems.find((li) =>
      li.textContent.toLowerCase().includes('instruction'),
    );
    act(() => fireEvent.click(instructionsItem));

    await waitFor(() => {
      expect(screen.getByTestId('instructions-form')).toBeInTheDocument();
    });
  });

  it('switches to MetadataForm when metadata menu item is clicked', async () => {
    setup();
    await waitFor(() => screen.getByTestId('description-form'));

    const listItems = screen.getAllByRole('listitem');
    const metadataItem = listItems.find((li) =>
      li.textContent.toLowerCase().includes('metadata'),
    );
    act(() => fireEvent.click(metadataItem));

    await waitFor(() => {
      expect(screen.getByTestId('metadata-form')).toBeInTheDocument();
    });
  });

  it('switches to ImageryForm when imagery menu item is clicked', async () => {
    setup();
    await waitFor(() => screen.getByTestId('description-form'));

    const listItems = screen.getAllByRole('listitem');
    const imageryItem = listItems.find((li) =>
      li.textContent.toLowerCase().includes('imagery'),
    );
    act(() => fireEvent.click(imageryItem));

    await waitFor(() => {
      expect(screen.getByTestId('imagery-form')).toBeInTheDocument();
    });
  });

  it('switches to PermissionsForm when permissions menu item is clicked', async () => {
    setup();
    await waitFor(() => screen.getByTestId('description-form'));

    const listItems = screen.getAllByRole('listitem');
    const permissionsItem = listItems.find((li) =>
      li.textContent.toLowerCase().includes('permission'),
    );
    act(() => fireEvent.click(permissionsItem));

    await waitFor(() => {
      expect(screen.getByTestId('permissions-form')).toBeInTheDocument();
    });
  });

  it('switches to SettingsForm when settings menu item is clicked', async () => {
    setup();
    await waitFor(() => screen.getByTestId('description-form'));

    const listItems = screen.getAllByRole('listitem');
    const settingsItem = listItems.find((li) =>
      li.textContent.toLowerCase().includes('settings'),
    );
    act(() => fireEvent.click(settingsItem));

    await waitFor(() => {
      expect(screen.getByTestId('settings-form')).toBeInTheDocument();
    });
  });

  it('switches to PriorityAreasForm when priority areas menu item is clicked', async () => {
    setup();
    await waitFor(() => screen.getByTestId('description-form'));

    const listItems = screen.getAllByRole('listitem');
    const priorityItem = listItems.find((li) =>
      li.textContent.toLowerCase().includes('priority'),
    );
    act(() => fireEvent.click(priorityItem));

    await waitFor(() => {
      expect(screen.getByTestId('priority-areas-form')).toBeInTheDocument();
    });
  });

  it('switches to ActionsForm when actions menu item is clicked', async () => {
    setup();
    await waitFor(() => screen.getByTestId('description-form'));

    const listItems = screen.getAllByRole('listitem');
    const actionsItem = listItems.find((li) =>
      li.textContent.toLowerCase().includes('action'),
    );
    act(() => fireEvent.click(actionsItem));

    await waitFor(() => {
      expect(screen.getByTestId('actions-form')).toBeInTheDocument();
    });
  });

  it('switches to CustomEditorForm when custom editor menu item is clicked', async () => {
    setup();
    await waitFor(() => screen.getByTestId('description-form'));

    const listItems = screen.getAllByRole('listitem');
    const customEditorItem = listItems.find((li) =>
      li.textContent.toLowerCase().includes('custom'),
    );
    act(() => fireEvent.click(customEditorItem));

    await waitFor(() => {
      expect(screen.getByTestId('custom-editor-form')).toBeInTheDocument();
    });
  });

  it('shows success alert after a successful save', async () => {
    pushToLocalJSONAPI.mockResolvedValue({ projectId: 42 });
    setup();
    await waitFor(() => screen.getByRole('button', { name: /save/i }));

    const saveBtn = screen.getByRole('button', { name: /save/i });
    act(() => fireEvent.click(saveBtn));

    await waitFor(() => {
      expect(screen.getByTestId('alert-success')).toBeInTheDocument();
    });
  });

  it('shows error alert after a server error on save', async () => {
    pushToLocalJSONAPI.mockRejectedValue(new Error('Server error'));
    setup();
    await waitFor(() => screen.getByRole('button', { name: /save/i }));

    const saveBtn = screen.getByRole('button', { name: /save/i });
    act(() => fireEvent.click(saveBtn));

    await waitFor(() => {
      expect(screen.getByTestId('alert-error')).toBeInTheDocument();
    });
  });

  it('shows validation error when projectInfo has no organisation set', async () => {
    const projectWithoutOrg = { ...mockProjectInfo, organisation: null };
    fetchLocalJSONAPI.mockResolvedValue(projectWithoutOrg);
    setup({ project: projectWithoutOrg });
    await waitFor(() => screen.getByRole('button', { name: /save/i }));

    const saveBtn = screen.getByRole('button', { name: /save/i });
    act(() => fireEvent.click(saveBtn));

    await waitFor(() => {
      expect(screen.getByTestId('alert-error')).toBeInTheDocument();
    });
  });

  it('shows validation error when mappingTypes is empty', async () => {
    const projectWithoutTypes = { ...mockProjectInfo, mappingTypes: [] };
    fetchLocalJSONAPI.mockResolvedValue(projectWithoutTypes);
    setup({ project: projectWithoutTypes });
    await waitFor(() => screen.getByRole('button', { name: /save/i }));

    const saveBtn = screen.getByRole('button', { name: /save/i });
    act(() => fireEvent.click(saveBtn));

    await waitFor(() => {
      expect(screen.getByTestId('alert-error')).toBeInTheDocument();
    });
  });
});
