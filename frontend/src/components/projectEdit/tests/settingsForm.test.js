import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SettingsForm } from '../settingsForm';
import { StateContext } from '../../../views/projectEdit';
import { IntlProviders } from '../../../utils/testWithIntl';

describe('SettingsForm task assignment toggle', () => {
  const renderForm = (projectInfo, setProjectInfo) =>
    render(
      <IntlProviders>
        <StateContext.Provider value={{ projectInfo, setProjectInfo }}>
          <SettingsForm languages={[]} defaultLocale="en" />
        </StateContext.Provider>
      </IntlProviders>,
    );

  const getToggle = () =>
    screen
      .getByText('Only assignees can work on assigned tasks')
      .parentElement.querySelector('input[type="checkbox"]');

  it('enables enforced task assignment', async () => {
    const setProjectInfo = jest.fn();
    const projectInfo = {
      mappingEditors: ['ID'],
      validationEditors: ['ID'],
      enforceTaskAssignment: false,
    };
    renderForm(projectInfo, setProjectInfo);
    expect(getToggle()).not.toBeChecked();
    await userEvent.setup().click(getToggle());
    expect(setProjectInfo).toHaveBeenCalledWith({ ...projectInfo, enforceTaskAssignment: true });
  });

  it('shows the current value', () => {
    renderForm(
      { mappingEditors: ['ID'], validationEditors: ['ID'], enforceTaskAssignment: true },
      jest.fn(),
    );
    expect(getToggle()).toBeChecked();
  });
});
