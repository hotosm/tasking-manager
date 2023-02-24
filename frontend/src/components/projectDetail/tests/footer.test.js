import React from 'react';
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ReduxIntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
import { ProjectDetailFooter } from '../footer';

describe('test if project detail footer', () => {
  const props = {
    projectId: 1,
    className: '',
  };
  it('renders footer for project with id 1', () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <ProjectDetailFooter {...props} />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText(/Overview/)).toBeInTheDocument();
    expect(screen.getByText(/Description/)).toBeInTheDocument();
    expect(screen.getByText(/Coordination/)).toBeInTheDocument();
    expect(screen.getByText(/Teams & Permissions/)).toBeInTheDocument();
    expect(screen.getByText(/Questions and comments/)).toBeInTheDocument();
    expect(screen.getByText(/Contributions/)).toBeInTheDocument();
    expect(screen.getByText('Share')).toBeInTheDocument();
    const contributeBtn = screen.getByRole('button', { pressed: false });
    const link = contributeBtn.closest('a');
    expect(link.href).toContain('/tasks');
    expect(contributeBtn.textContent).toBe('Contribute');
  });
});
