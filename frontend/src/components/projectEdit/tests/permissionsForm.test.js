import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PermissionsForm } from '../permissionsForm';
import { StateContext } from '../../../views/projectEdit';
import { ReduxIntlProviders, QueryClientProviders } from '../../../utils/testWithIntl';
import * as UseFetchHook from '../../../hooks/UseFetch';

jest.mock('../teamSelect', () => ({
  TeamSelect: () => <div data-testid="team-select">Team Select Component</div>,
}));

jest.mock('../permissionsBlock', () => ({
  PermissionsBlock: ({ type }) => <div data-testid={`permissions-block-${type}`}>Permissions Block {type}</div>,
}));

const mockProjectInfo = {
  private: false,
};

const renderForm = (projectInfo = mockProjectInfo, setProjectInfo = jest.fn()) => {
  return render(
    <ReduxIntlProviders>
      <QueryClientProviders>
        <StateContext.Provider value={{ projectInfo, setProjectInfo }}>
          <PermissionsForm />
        </StateContext.Provider>
      </QueryClientProviders>
    </ReduxIntlProviders>
  );
};

describe('PermissionsForm', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    jest.spyOn(UseFetchHook, 'useFetch').mockReturnValue([false, true, null]);
    const { container } = renderForm();
    expect(container).toBeEmptyDOMElement(); // Returns false when loading
  });

  it('renders error state', () => {
    jest.spyOn(UseFetchHook, 'useFetch').mockReturnValue([true, false, null]);
    const { container } = renderForm();
    expect(container).toBeEmptyDOMElement(); // Returns false on error
  });

  it('renders form correctly with levels', () => {
    jest.spyOn(UseFetchHook, 'useFetch').mockReturnValue([false, false, { levels: [{ id: 1, name: 'BEGINNER' }] }]);
    renderForm();
    
    expect(screen.getByTestId('permissions-block-mappingPermission')).toBeInTheDocument();
    expect(screen.getByTestId('permissions-block-validationPermission')).toBeInTheDocument();
    expect(screen.getByTestId('team-select')).toBeInTheDocument();
    expect(screen.getByText(/Private project/i)).toBeInTheDocument();
  });

  it('handles private project toggle', async () => {
    jest.spyOn(UseFetchHook, 'useFetch').mockReturnValue([false, false, { levels: [] }]);
    const setProjectInfo = jest.fn();
    const user = userEvent.setup();
    renderForm(mockProjectInfo, setProjectInfo);

    const toggle = screen.getByRole('checkbox');
    await user.click(toggle);

    expect(setProjectInfo).toHaveBeenCalledWith({ private: true });
  });
});
