import { FormattedMessage } from 'react-intl';

import { createComponentWithIntl, IntlProviders } from '../../../utils/testWithIntl';
import { TaskStatus } from '../taskList';
import { LockIcon } from '../../svgIcons';
import { render, screen } from '@testing-library/react';
import messages from '../messages';

describe('test correct elements of TaskStatus', () => {
  it('with LOCKED_FOR_MAPPING status & lockHolder', () => {
    const { container } = render(
      <IntlProviders>
        <TaskStatus status="LOCKED_FOR_MAPPING" lockHolder="test_user" />
      </IntlProviders>
    );
    expect(container.querySelectorAll("span")[0]).toHaveStyle({
      backgroundColor: '#fff',
      height: '0.875rem',
      width: '0.875rem',
    });
    expect(container.querySelectorAll("span")[0]).toHaveClass('ba bw1 b--grey-light dib v-mid');
    expect(screen.getByText("Locked for mapping by test_user")).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveClass("v-mid pl1 h1 w1");
  });

  it('with LOCKED_FOR_MAPPING status and without lockHolder', () => {
    const { container } = render(
      <IntlProviders>
        <TaskStatus status="LOCKED_FOR_MAPPING" />
      </IntlProviders>
    );

    expect(container.querySelector("span")).toHaveStyle({
      backgroundColor: '#fff',
      height: '0.875rem',
      width: '0.875rem',
    });
    expect(container.querySelector("span")).toHaveClass(
      'ba bw1 b--grey-light dib v-mid',
    );
    expect(screen.getByText(messages.taskStatus_LOCKED_FOR_MAPPING.defaultMessage)).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveClass("v-mid pl1 h1 w1");
  });

  it('with LOCKED_FOR_VALIDATION status and with lockHolder', () => {
    const { container } = render(
      <IntlProviders>
        <TaskStatus status="LOCKED_FOR_VALIDATION" lockHolder="test_user" />
      </IntlProviders>
    );

    expect(container.querySelector("span")).toHaveStyle({
      backgroundColor: '#ade6ef',
      height: '1rem',
      width: '1rem',
    });
    expect(container.querySelector("span")).toHaveClass(' dib v-mid');
    expect(screen.getByText("Locked for validation by test_user")).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveClass("v-mid pl1 h1 w1");
  });

  it('with LOCKED_FOR_VALIDATION status and without lockHolder', () => {
    const { container } = render(
      <IntlProviders>
        <TaskStatus status="LOCKED_FOR_VALIDATION" />
      </IntlProviders>
    );

    expect(container.querySelector("span")).toHaveStyle({
      backgroundColor: '#ade6ef',
      height: '1rem',
      width: '1rem',
    });
    expect(container.querySelector("span")).toHaveClass(' dib v-mid');
    expect(screen.getByText(messages.taskStatus_LOCKED_FOR_VALIDATION.defaultMessage)).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveClass("v-mid pl1 h1 w1");
  });

  it('with READY status', () => {
    const { container } = render(
      <IntlProviders>
        <TaskStatus status="READY" />
      </IntlProviders>
    );

    expect(container.querySelector("span")).toHaveStyle({
      backgroundColor: '#fff',
      height: '0.875rem',
      width: '0.875rem',
    });
    expect(container.querySelector("span")).toHaveClass(
      'ba bw1 b--grey-light dib v-mid',
    );
    expect(screen.getByText(messages.taskStatus_READY.defaultMessage)).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  it('with MAPPED status', () => {
    const { container } = render(
      <IntlProviders>
        <TaskStatus status="MAPPED" />
      </IntlProviders>
    );

    expect(container.querySelector("span")).toHaveStyle({
      backgroundColor: '#ade6ef',
      height: '1rem',
      width: '1rem',
    });
    expect(container.querySelector("span")).toHaveClass(' dib v-mid');
    expect(screen.getByText(messages.taskStatus_MAPPED.defaultMessage)).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  it('with VALIDATED status', () => {
    const { container } = render(
      <IntlProviders>
        <TaskStatus status="VALIDATED" />
      </IntlProviders>
    );

    expect(container.querySelector("span")).toHaveStyle({
      backgroundColor: '#40ac8c',
      height: '1rem',
      width: '1rem',
    });
    expect(container.querySelector("span")).toHaveClass(' dib v-mid');
    expect(screen.getByText(messages.taskStatus_VALIDATED.defaultMessage)).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  it('with INVALIDATED status', () => {
    const { container } = render(
      <IntlProviders>
        <TaskStatus status="INVALIDATED" />
      </IntlProviders>
    );

    expect(container.querySelector("span")).toHaveStyle({
      backgroundColor: '#fceca4',
      height: '1rem',
      width: '1rem',
    });
    expect(container.querySelector("span")).toHaveClass(' dib v-mid');
    expect(screen.getByText(messages.taskStatus_INVALIDATED.defaultMessage)).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  it('with BADIMAGERY status', () => {
    const { container } = render(
      <IntlProviders>
        <TaskStatus status="BADIMAGERY" />
      </IntlProviders>
    );

    expect(container.querySelector("span")).toHaveStyle({
      backgroundColor: '#d8dae4',
      height: '1rem',
      width: '1rem',
    });
    expect(container.querySelector("span")).toHaveClass(' dib v-mid');
    expect(screen.getByText(messages.taskStatus_BADIMAGERY.defaultMessage)).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });
});
