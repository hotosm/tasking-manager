import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ReduxIntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
import { ManagementMenu } from '../menu';

describe('ManagementMenu items for', () => {
  it('ADMIN users can see all items', () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <ManagementMenu isAdmin={true} />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('Overview').closest('a').href).toContain('/');
    expect(screen.getByText('Statistics').closest('a').href).toContain('/stats');
    expect(screen.getByText('Users').closest('a').href).toContain('/users');
    expect(screen.getByText('Licenses').closest('a').href).toContain('/licenses');
    expect(screen.getByText('Campaigns').closest('a').href).toContain('/campaigns');
    expect(screen.getByText('Categories').closest('a').href).toContain('/categories');
    expect(screen.getByText('Projects').closest('a').href).toContain('/projects');
    expect(screen.getByText('Organizations').closest('a').href).toContain('/organisations');
    expect(screen.getByText('Teams').closest('a').href).toContain('/teams');
  });

  it('non ADMIN users can see only Statistics and other 4 items', () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <ManagementMenu isAdmin={false} />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('Overview').closest('a').href).toContain('/');
    expect(screen.getByText('Statistics').closest('a').href).toContain('/stats');
    expect(screen.getByText('Projects').closest('a').href).toContain('/projects');
    expect(screen.getByText('Organizations').closest('a').href).toContain('/organisations');
    expect(screen.getByText('Teams').closest('a').href).toContain('/teams');
    expect(screen.queryByText('Users')).not.toBeInTheDocument();
    expect(screen.queryByText('Licenses')).not.toBeInTheDocument();
    expect(screen.queryByText('Campaigns')).not.toBeInTheDocument();
    expect(screen.queryByText('Categories')).not.toBeInTheDocument();
  });
});
