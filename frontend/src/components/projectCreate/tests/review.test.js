import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import Review from '../review';
import { IntlProviders } from '../../../utils/testWithIntl';
import { projectMetadata } from '../../../utils/tests/snippets/projectMetadata';

describe('Review Component', () => {
  const setup = (props) => {
    return render(
      <IntlProviders>
        <Review {...props} />
      </IntlProviders>
    );
  };

  const defaultProps = {
    metadata: { ...projectMetadata, tasksNumber: 150 },
    updateMetadata: jest.fn(),
    token: 'test-token',
    projectId: null,
    cloneProjectData: { name: null, organisation: null },
  };

  it('renders project name input when not cloning', () => {
    setup(defaultProps);
    expect(screen.getByText('Step 4: review')).toBeInTheDocument();
    expect(screen.getByText('Your project will be created with 150 tasks.')).toBeInTheDocument();
    
    const nameInput = screen.getByLabelText('Name');
    expect(nameInput).toBeInTheDocument();

    fireEvent.change(nameInput, { target: { value: 'New Project' } });
    expect(defaultProps.updateMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ projectName: 'New Project' })
    );
  });

  it('does not render project name input when cloning', () => {
    setup({ ...defaultProps, cloneProjectData: { name: 'Clone Name', organisation: 1 } });
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
    expect(screen.queryByText('Organization')).not.toBeInTheDocument();
  });

});
