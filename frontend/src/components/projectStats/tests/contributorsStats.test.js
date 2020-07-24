import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { store } from '../../../store';
import { ConnectedIntl } from '../../../utils/internationalization';
import { projectContributions } from '../../../network/tests/mockData/contributions';
import ContributorsStats from '../contributorsStats';

test('ContributorsStats renders the correct labels and numbers', () => {
  const { container } = render(
    <Provider store={store}>
      <ConnectedIntl>
        <ContributorsStats contributors={projectContributions} />
      </ConnectedIntl>
    </Provider>,
  );
  expect(screen.getByText('4')).toBeInTheDocument();
  expect(screen.getByText('3')).toBeInTheDocument();
  expect(screen.getByText('5')).toBeInTheDocument();
  expect(screen.getByText('Mappers')).toBeInTheDocument();
  expect(screen.getByText('Validators')).toBeInTheDocument();
  expect(screen.getByText('Total contributors')).toBeInTheDocument();
  expect(screen.getByText('Users by experience on Tasking Manager')).toBeInTheDocument();
  expect(screen.getByText('Users by level')).toBeInTheDocument();
  expect(container.querySelectorAll('canvas').length).toBe(2);
});

test('ContributorsStats renders values as 0 if the project did not received contributions', () => {
  const { container } = render(
    <Provider store={store}>
      <ConnectedIntl>
        <ContributorsStats contributors={{ userContributions: [] }} />
      </ConnectedIntl>
    </Provider>,
  );
  expect(screen.getAllByText('0').length).toBe(3);
  expect(container.querySelectorAll('canvas').length).toBe(2);
});
