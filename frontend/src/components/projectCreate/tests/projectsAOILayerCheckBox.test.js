import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

import { ProjectsAOILayerCheckBox } from '../projectsAOILayerCheckBox';
import { IntlProviders } from '../../../utils/testWithIntl';

describe('ProjectsAOILayerCheckBox', () => {
  const testFn = jest.fn();
  it('with disabled property', async () => {
    const user = userEvent.setup();
    render(
      <IntlProviders>
        <ProjectsAOILayerCheckBox isActive={false} setActive={testFn} disabled={true} />
      </IntlProviders>,
    );
    expect(screen.getByText('Show existing projects AoIs')).toBeInTheDocument();
    expect(screen.getByRole('checkbox').className).toContain('b--grey-light');
    expect(screen.getByRole('checkbox').className).not.toContain('b--red');
    await user.hover(screen.getByText('Show existing projects AoIs'));
    expect(
      screen.getByText(
        "Zoom in to be able to activate the visualization of other projects' areas of interest.",
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox'));
    expect(testFn).not.toHaveBeenCalled();
  });
  it('with disabled=false property', async () => {
    const user = userEvent.setup();
    render(
      <IntlProviders>
        <ProjectsAOILayerCheckBox isActive={false} setActive={testFn} disabled={false} />
      </IntlProviders>,
    );
    expect(screen.getByText('Show existing projects AoIs')).toBeInTheDocument();
    expect(screen.getByRole('checkbox').className).not.toContain('b--grey-light');
    expect(screen.getByRole('checkbox').className).toContain('b--red');
    await user.hover(screen.getByText('Show existing projects AoIs'));
    expect(
      screen.getByText("Enable the visualization of the existing projects' areas of interest."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox'));
    expect(testFn).toHaveBeenCalled();
  });
});
