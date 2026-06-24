import '@testing-library/jest-dom';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { BadgesManagement, BadgeInformation, BadgeUpdateForm } from '../index';
import { renderWithRouter, ReduxIntlProviders } from '../../../utils/testWithIntl';
import { Form } from 'react-final-form';
import * as UploadHooks from '../../../hooks/UseUploadImage';

jest.mock('../../../hooks/UseUploadImage', () => ({
  useUploadImage: () => [false, false, jest.fn()],
}));

describe('BadgesManagement Component', () => {
  const badges = [
    { id: 1, name: 'Badge 1', description: 'Description 1', imagePath: '/path1.png' },
    { id: 2, name: 'Badge 2', description: 'Description 2', imagePath: '/path2.png' },
  ];

  it('renders badges when fetched', () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <BadgesManagement badges={badges} isFetched={true} />
      </ReduxIntlProviders>
    );

    expect(screen.getByText('Badge 1')).toBeInTheDocument();
    expect(screen.getByText('Description 1')).toBeInTheDocument();
    expect(screen.getByText('Badge 2')).toBeInTheDocument();
  });

  it('renders no badges message when empty', () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <BadgesManagement badges={[]} isFetched={true} />
      </ReduxIntlProviders>
    );

    expect(screen.getByText('There are no badges yet')).toBeInTheDocument();
  });
});

describe('BadgeInformation Component', () => {
  it('renders correctly', () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <Form onSubmit={jest.fn()}>
          {({ handleSubmit }) => (
            <form onSubmit={handleSubmit}>
              <BadgeInformation badge={{}} />
            </form>
          )}
        </Form>
      </ReduxIntlProviders>
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Hidden')).toBeInTheDocument();
  });
});

describe('BadgeUpdateForm Component', () => {
  const badge = { id: 1, name: 'Original', description: 'Desc', imagePath: 'x.png', requirements: '{"metric": 1}' };
  
  it('renders form and allows submitting', async () => {
    const updateBadge = jest.fn();
    renderWithRouter(
      <ReduxIntlProviders>
        <BadgeUpdateForm badge={badge} updateBadge={updateBadge} />
      </ReduxIntlProviders>
    );

    expect(screen.getByDisplayValue('Original')).toBeInTheDocument();
    
    // Modify input
    fireEvent.change(screen.getByDisplayValue('Original'), { target: { value: 'Updated' } });
    
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => expect(updateBadge).toHaveBeenCalled());
  });

  it('allows canceling edits', async () => {
    const updateBadge = jest.fn();
    renderWithRouter(
      <ReduxIntlProviders>
        <BadgeUpdateForm badge={badge} updateBadge={updateBadge} />
      </ReduxIntlProviders>
    );

    fireEvent.change(screen.getByDisplayValue('Original'), { target: { value: 'Updated' } });
    fireEvent.click(screen.getByText('Cancel'));

    await waitFor(() => expect(screen.queryByText('Save')).not.toBeInTheDocument());
  });
});
