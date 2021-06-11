import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

import { ProjectsAOILayerCheckBox } from '../projectsAOILayerCheckBox';
import { IntlProviders } from '../../../utils/testWithIntl';

describe('ProjectsAOILayerCheckBox', () => {
  const testFn = jest.fn();
  it('with disabled property', () => {
    render(
      <IntlProviders>
        <ProjectsAOILayerCheckBox isActive={false} setActive={testFn} disabled={true} />
      </IntlProviders>,
    );
    expect(screen.getByText('Show existing projects')).toBeInTheDocument();
    expect(screen.getByRole('checkbox').className).toContain('b--grey-light');
    expect(screen.getByRole('checkbox').className).not.toContain('b--red');
    userEvent.hover(screen.getByText('Show existing projects'));
    expect(
      screen.getByText(
        "Zoom in to be able to activate the visualization of other projects' areas of interest.",
      ),
    ).toBeInTheDocument();
    userEvent.click(screen.getByRole('checkbox'));
    expect(testFn).not.toHaveBeenCalled();
  });
  it('with disabled=false property', () => {
    render(
      <IntlProviders>
        <ProjectsAOILayerCheckBox isActive={false} setActive={testFn} disabled={false} />
      </IntlProviders>,
    );
    expect(screen.getByText('Show existing projects')).toBeInTheDocument();
    expect(screen.getByRole('checkbox').className).not.toContain('b--grey-light');
    expect(screen.getByRole('checkbox').className).toContain('b--red');
    userEvent.hover(screen.getByText('Show existing projects'));
    expect(
      screen.getByText("Enable the visualization of the existing projects' areas of interest."),
    ).toBeInTheDocument();
    userEvent.click(screen.getByRole('checkbox'));
    expect(testFn).toHaveBeenCalled();
  });
});
