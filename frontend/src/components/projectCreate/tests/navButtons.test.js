import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import NavButtons from '../navButtons';
import { IntlProviders } from '../../../utils/testWithIntl';
import { projectMetadata } from '../../../utils/tests/snippets/projectMetadata';

describe('NavButtons Component', () => {
  const setup = (props) => {
    return render(
      <IntlProviders>
        <NavButtons {...props} />
      </IntlProviders>
    );
  };

  const defaultProps = {
    index: 1,
    metadata: { ...projectMetadata, area: 100 },
    maxArea: 1000,
    updateMetadata: jest.fn(),
    setErr: jest.fn(),
    setStep: jest.fn(),
    cloneProjectData: { name: null },
    handleCreate: jest.fn(),
    mapObj: {
      map: {
        getSource: (source) => ({
          setData: jest.fn(),
          _data: { type: 'FeatureCollection', features: [] },
        }),
      },
      draw: {
        getTerraDrawInstance: jest.fn(() => ({
          getSnapshot: jest.fn(() => []),
          removeFeatures: jest.fn(),
        })),
      },
    },
  };

  it('renders Next button on step 1 and validates area', async () => {
    setup(defaultProps);
    const nextBtn = screen.getByText('Next');
    expect(nextBtn).toBeInTheDocument();
    
    // Check validation on clicking next
    fireEvent.click(nextBtn);
    expect(defaultProps.setErr).toHaveBeenCalledWith({ error: false, message: '' });
    expect(defaultProps.setStep).toHaveBeenCalledWith(2);
  });

  it('renders back button from step 2 onwards', () => {
    setup({ ...defaultProps, index: 2 });
    const backBtn = screen.getByText('Back to previous');
    expect(backBtn).toBeInTheDocument();
    
    fireEvent.click(backBtn);
    expect(defaultProps.setStep).toHaveBeenCalledWith(1);
  });

  it('validates area over limit on step 1', () => {
    setup({ ...defaultProps, metadata: { ...defaultProps.metadata, area: 2000 } });
    fireEvent.click(screen.getByText('Next'));
    expect(defaultProps.setErr).toHaveBeenCalledWith(
      expect.objectContaining({ error: true })
    );
  });

  it('renders Create button on step 4', () => {
    setup({ ...defaultProps, index: 4 });
    const createBtn = screen.getByText('Create');
    expect(createBtn).toBeInTheDocument();
    fireEvent.click(createBtn);
    expect(defaultProps.handleCreate).toHaveBeenCalled();
  });
});
