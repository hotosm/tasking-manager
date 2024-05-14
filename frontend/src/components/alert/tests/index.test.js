import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Alert } from '../index';

describe('Alert Component', () => {
  it('with error type', () => {
    const { container } = render(<Alert type="error">An error message</Alert>);
    expect(container.querySelector('svg')).toBeInTheDocument(); // ban icon
    expect(container.querySelector('.dark-red')).toBeInTheDocument();
    expect(container.querySelector('div').className).toBe(
      'db blue-dark bl bw2 br2 pa3 b--dark-red bg-washed-red',
    );
    expect(screen.queryByText(/An error message/)).toBeInTheDocument();
  });

  it('with success type', () => {
    const { container } = render(
      <Alert type="success" inline={true}>
        Success message comes here
      </Alert>,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(container.querySelector('.dark-green')).toBeInTheDocument();
    const divClassName = container.querySelector('div').className;
    expect(divClassName).toContain('b--dark-green bg-washed-green');
    expect(divClassName).toContain('di');
    expect(divClassName).not.toContain('db');
    expect(screen.queryByText(/Success message comes here/)).toBeInTheDocument();
  });

  it('with info type', () => {
    const { container } = render(
      <Alert type="info" compact={true}>
        Information
      </Alert>,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(container.querySelector('.blue')).toBeInTheDocument();
    const divClassName = container.querySelector('div').className;
    expect(divClassName).toContain('b--blue bg-lightest-blue');
    expect(divClassName).toContain('db');
    expect(divClassName).not.toContain('di');
    expect(divClassName).toContain('pa2');
    expect(divClassName).not.toContain('pa3');
    expect(screen.queryByText(/Information/)).toBeInTheDocument();
  });

  it('with warning type', () => {
    const { container } = render(
      <Alert type="warning" inline={true} compact={true}>
        It's only a warning...
      </Alert>,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(container.querySelector('.gold')).toBeInTheDocument();
    const divClassName = container.querySelector('div').className;
    expect(divClassName).toContain('b--gold bg-washed-yellow');
    expect(divClassName).toContain('di');
    expect(divClassName).toContain('pa2');
    expect(screen.queryByText(/It's only a warning.../)).toBeInTheDocument();
  });
});
