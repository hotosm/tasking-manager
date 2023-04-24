import { Provider } from 'react-redux';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { store } from '../../../store';
import { ConnectedIntl } from '../../../utils/internationalization';
import { projectContributions } from '../../../network/tests/mockData/contributions';
import ContributorsStats from '../contributorsStats';

jest.mock('react-chartjs-2', () => ({
  Doughnut: () => null,
  Bar: () => null,
}));

test('ContributorsStats renders the correct labels and numbers', async () => {
  const { getByText } = render(
    <Provider store={store}>
      <ConnectedIntl>
        <ContributorsStats contributors={projectContributions.userContributions} />
      </ConnectedIntl>
    </Provider>,
  );
  await waitFor(() => expect(getByText('4')).toBeInTheDocument());
  expect(getByText('3')).toBeInTheDocument();
  expect(getByText('5')).toBeInTheDocument();
  expect(getByText('Mappers')).toBeInTheDocument();
  expect(getByText('Validators')).toBeInTheDocument();
  expect(getByText('Total contributors')).toBeInTheDocument();
  expect(getByText('Users by experience on Tasking Manager')).toBeInTheDocument();
  expect(getByText('Users by level')).toBeInTheDocument();
});

test('ContributorsStats renders values as 0 if the project did not received contributions', async () => {
  const { getAllByText } = render(
    <Provider store={store}>
      <ConnectedIntl>
        <ContributorsStats contributors={[]} />
      </ConnectedIntl>
    </Provider>,
  );
  await waitFor(() => expect(getAllByText('0').length).toBe(3));
  expect(getAllByText('0').length).toBe(3);
});
