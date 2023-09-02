import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Button, CustomButton, EditButton } from '../button';
import { BanIcon } from '../svgIcons';
import { renderWithRouter } from '../../utils/testWithIntl';
import userEvent from '@testing-library/user-event';

describe('Button', () => {
  it('children and onClick props', async () => {
    let testVar;
    const user = userEvent.setup();
    const { container } = render(
      <Button className="black bg-white" onClick={() => (testVar = true)}>
        Test it
      </Button>,
    );
    expect(screen.getByText('Test it')).toBeInTheDocument();
    expect(screen.getByRole('button').className).toBe('black bg-white br1 f5 bn pointer');
    expect(container.querySelector('svg')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button'));
    expect(testVar).toEqual(true);
  });
  it('loading prop', async () => {
    let testVar = false;
    const user = userEvent.setup();
    const { container } = render(
      <Button
        className="red bg-white"
        loading={true}
        onClick={() => (testVar = true)}
        icon={<BanIcon className="h1 w1 blue" />}
      >
        Loading
      </Button>,
    );
    expect(screen.getByText('Loading')).toBeInTheDocument();
    expect(screen.getByRole('button').className).toBe('red bg-white br1 f5 bn o-50');
    expect(container.querySelector('svg')).toBeInTheDocument(); // loading icon
    expect(container.querySelector('.mr2')).toBeInTheDocument(); // space after icon
    expect(container.querySelector('.blue')).not.toBeInTheDocument(); // ban icon is not present

    await user.click(screen.getByRole('button'));
    expect(testVar).toBeFalsy();
  });
  it('disabled and icons props', async () => {
    let testVar = false;
    const user = userEvent.setup();
    const { container } = render(
      <Button
        className="red bg-white"
        disabled={true}
        onClick={() => (testVar = true)}
        icon={<BanIcon className="h1 w1 blue" />}
      >
        Cancel
      </Button>,
    );
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByRole('button').className).toBe('red bg-white br1 f5 bn o-50');
    expect(container.querySelector('svg')).toBeInTheDocument(); // ban icon
    expect(container.querySelector('.blue')).toBeInTheDocument();
    expect(container.querySelector('.mr2')).toBeInTheDocument(); // space after icon

    await user.click(screen.getByRole('button'));
    expect(testVar).toBeFalsy();
  });
});

describe('CustomButton', () => {
  it('children and onClick props, without icon', async () => {
    let testVar;
    const user = userEvent.setup();
    const { container } = render(
      <CustomButton className="black bg-white" onClick={() => (testVar = true)}>
        Test it
      </CustomButton>,
    );
    expect(screen.getByText('Test it')).toBeInTheDocument();
    expect(screen.getByRole('button').className).toBe('black bg-white br1 f5 pointer');
    expect(container.querySelector('svg')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button'));
    expect(testVar).toEqual(true);
  });
  it('loading prop', async () => {
    let testVar = false;
    const user = userEvent.setup();
    const { container } = render(
      <CustomButton
        className="red bg-white"
        loading={true}
        onClick={() => (testVar = true)}
        icon={<BanIcon className="h1 w1 blue" />}
      >
        Loading
      </CustomButton>,
    );
    expect(screen.getByText('Loading')).toBeInTheDocument();
    expect(screen.getByRole('button').className).toBe('red bg-white br1 f5 o-50');
    expect(container.querySelector('svg')).toBeInTheDocument(); // loading icon
    expect(container.querySelector('.mr2')).toBeInTheDocument(); // space after icon
    expect(container.querySelector('.blue')).not.toBeInTheDocument(); // ban icon is not present

    await user.click(screen.getByRole('button'));
    expect(testVar).toBeFalsy();
  });
  it('disabled and icons props', async () => {
    let testVar = false;
    const user = userEvent.setup();
    const { container } = render(
      <CustomButton
        className="red bg-white"
        disabled={true}
        onClick={() => (testVar = true)}
        icon={<BanIcon className="h1 w1 blue" />}
      >
        Cancel
      </CustomButton>,
    );
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByRole('button').className).toBe('red bg-white br1 f5 o-50');
    expect(container.querySelector('svg')).toBeInTheDocument(); // ban icon
    expect(container.querySelector('.blue')).toBeInTheDocument();
    expect(container.querySelector('.mr2')).toBeInTheDocument(); // space after icon

    await user.click(screen.getByRole('button'));
    expect(testVar).toBeFalsy();
  });
});

it('children and link props of EditButton', () => {
  renderWithRouter(<EditButton url="/manage/projects/1/">Edit project</EditButton>);

  expect(screen.getByText('Edit project')).toBeInTheDocument();
  expect(screen.getByText('Edit project').href).toContain('/manage/projects/1/');
  expect(screen.getByText('Edit project').className).toBe(
    'pointer no-underline br1 fw6 f7 dib pv2 ph3 ba b--red white bg-red mh1 mv1',
  );
});
