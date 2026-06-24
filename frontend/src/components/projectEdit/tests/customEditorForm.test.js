import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CustomEditorForm } from '../customEditorForm';
import { StateContext } from '../../../views/projectEdit';
import { ReduxIntlProviders } from '../../../utils/testWithIntl';

const mockProjectInfo = {
  customEditor: {
    name: 'My Editor',
    description: 'A custom editor',
    url: 'http://custom-editor.com',
  },
  mappingEditors: ['ID', 'CUSTOM'],
  validationEditors: ['JOSM'],
};

const renderWithContext = (projectInfo = mockProjectInfo, setProjectInfo = jest.fn()) => {
  return render(
    <ReduxIntlProviders>
      <StateContext.Provider value={{ projectInfo, setProjectInfo }}>
        <CustomEditorForm />
      </StateContext.Provider>
    </ReduxIntlProviders>
  );
};

describe('CustomEditorForm', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with custom editor data', () => {
    renderWithContext();
    expect(screen.getByDisplayValue('My Editor')).toBeInTheDocument();
    expect(screen.getByDisplayValue('http://custom-editor.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('A custom editor')).toBeInTheDocument();
  });

  it('renders correctly without custom editor data', () => {
    const emptyInfo = { ...mockProjectInfo, customEditor: null };
    renderWithContext(emptyInfo);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs[0]).toHaveValue('');
    expect(inputs[1]).toHaveValue('');
    expect(inputs[2]).toHaveValue('');
    expect(screen.queryByText(/Delete Custom Editor/i)).not.toBeInTheDocument();
  });

  it('handles name change', async () => {
    const setProjectInfo = jest.fn();
    const user = userEvent.setup();
    renderWithContext(mockProjectInfo, setProjectInfo);

    const nameInput = screen.getByDisplayValue('My Editor');
    fireEvent.change(nameInput, { target: { value: 'My Editor 2' } });

    expect(setProjectInfo).toHaveBeenLastCalledWith({
      ...mockProjectInfo,
      customEditor: { ...mockProjectInfo.customEditor, name: 'My Editor 2' },
    });
  });

  it('handles url change', async () => {
    const setProjectInfo = jest.fn();
    const user = userEvent.setup();
    renderWithContext(mockProjectInfo, setProjectInfo);

    const urlInput = screen.getByDisplayValue('http://custom-editor.com');
    fireEvent.change(urlInput, { target: { value: 'http://custom-editor.com/test' } });

    expect(setProjectInfo).toHaveBeenLastCalledWith({
      ...mockProjectInfo,
      customEditor: { ...mockProjectInfo.customEditor, url: 'http://custom-editor.com/test' },
    });
  });

  it('handles description change', async () => {
    const setProjectInfo = jest.fn();
    const user = userEvent.setup();
    renderWithContext(mockProjectInfo, setProjectInfo);

    const descInput = screen.getByDisplayValue('A custom editor');
    fireEvent.change(descInput, { target: { value: 'A custom editor updated' } });

    expect(setProjectInfo).toHaveBeenLastCalledWith({
      ...mockProjectInfo,
      customEditor: { ...mockProjectInfo.customEditor, description: 'A custom editor updated' },
    });
  });

  it('handles mapping editors toggle ON/OFF', async () => {
    const setProjectInfo = jest.fn();
    const user = userEvent.setup();
    renderWithContext(mockProjectInfo, setProjectInfo);

    const mappingCheckbox = screen.getAllByRole('checkbox')[0];
    await user.click(mappingCheckbox);

    expect(setProjectInfo).toHaveBeenLastCalledWith({
      ...mockProjectInfo,
      mappingEditors: ['ID'], // removed CUSTOM
    });
  });

  it('handles mapping editors toggle when adding CUSTOM', async () => {
    const setProjectInfo = jest.fn();
    const user = userEvent.setup();
    const noCustomMapInfo = { ...mockProjectInfo, mappingEditors: ['ID'] };
    renderWithContext(noCustomMapInfo, setProjectInfo);

    const mappingCheckbox = screen.getAllByRole('checkbox')[0];
    await user.click(mappingCheckbox);

    expect(setProjectInfo).toHaveBeenLastCalledWith({
      ...noCustomMapInfo,
      mappingEditors: ['ID', 'CUSTOM'],
    });
  });

  it('handles validation editors toggle ON/OFF', async () => {
    const setProjectInfo = jest.fn();
    const user = userEvent.setup();
    renderWithContext(mockProjectInfo, setProjectInfo);

    const validationCheckbox = screen.getAllByRole('checkbox')[1];
    await user.click(validationCheckbox);

    expect(setProjectInfo).toHaveBeenLastCalledWith({
      ...mockProjectInfo,
      validationEditors: ['JOSM', 'CUSTOM'], // added CUSTOM
    });
  });

  it('handles validation editors toggle when removing CUSTOM', async () => {
    const setProjectInfo = jest.fn();
    const user = userEvent.setup();
    const customValInfo = { ...mockProjectInfo, validationEditors: ['JOSM', 'CUSTOM'] };
    renderWithContext(customValInfo, setProjectInfo);

    const validationCheckbox = screen.getAllByRole('checkbox')[1];
    await user.click(validationCheckbox);

    expect(setProjectInfo).toHaveBeenLastCalledWith({
      ...customValInfo,
      validationEditors: ['JOSM'], // removed CUSTOM
    });
  });

  it('handles remove custom editor button', async () => {
    const setProjectInfo = jest.fn();
    const user = userEvent.setup();
    renderWithContext(mockProjectInfo, setProjectInfo);

    const removeBtn = screen.getByRole('button');
    await user.click(removeBtn);

    expect(setProjectInfo).toHaveBeenLastCalledWith({
      ...mockProjectInfo,
      customEditor: null,
    });
  });
});
