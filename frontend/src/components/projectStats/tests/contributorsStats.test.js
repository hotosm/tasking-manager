import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { store } from '../../../store';
import { ConnectedIntl } from '../../../utils/internationalization';
import { projectContributions } from '../../../network/tests/mockData/contributions';
import ContributorsStats from '../contributorsStats';

jest.mock('react-chartjs-2', () => ({
  Doughnut: () => null,
  Bar: () => null,
}));

test('ContributorsStats renders the correct labels and numbers', () => {
  render(
    <Provider store={store}>
      <ConnectedIntl>
        <ContributorsStats contributors={projectContributions.userContributions} />
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
});

test('ContributorsStats renders values as 0 if the project did not received contributions', () => {
  render(
    <Provider store={store}>
      <ConnectedIntl>
        <ContributorsStats contributors={[]} />
      </ConnectedIntl>
    </Provider>,
  );
  expect(screen.getAllByText('0').length).toBe(3);
});
