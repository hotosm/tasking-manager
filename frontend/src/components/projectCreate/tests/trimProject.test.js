import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import TrimProject from '../trimProject';
import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import * as genericJSONRequest from '../../../network/genericJSONRequest';

describe('TrimProject Component', () => {
  const setup = (props) => {
    return render(
      <ReduxIntlProviders>
        <TrimProject {...props} />
      </ReduxIntlProviders>
    );
  };

  const mapObj = {
    map: {
      getSource: (source) => ({
        setData: jest.fn(),
      }),
    },
  };

  const defaultProps = {
    metadata: {
      geom: {},
      tempTaskGrid: {},
      taskGrid: {
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]] // large area
              ]
            }
          }
        ]
      }
    },
    updateMetadata: jest.fn(),
    mapObj: mapObj
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders trim project step and handles trim', async () => {
    jest.spyOn(genericJSONRequest, 'pushToLocalJSONAPI').mockResolvedValue({
      features: [{ id: 1 }]
    });

    setup(defaultProps);
    expect(screen.getByText('Step 3: trim task grid')).toBeInTheDocument();
    
    // Tiny tasks number is 0 because area is large enough (mocked or actual turf area is huge)
    const trimBtn = screen.getByText('Trim');
    expect(trimBtn).toBeInTheDocument();
    
    // toggle switch
    const toggle = screen.getByRole('checkbox');
    fireEvent.click(toggle);
    
    fireEvent.click(trimBtn);
    
    await waitFor(() => {
      expect(defaultProps.updateMetadata).toHaveBeenCalledWith(
        expect.objectContaining({ tasksNumber: 1 })
      );
    });
  });

  it('shows tiny tasks discard option and handles discard', () => {
    // Provide a small polygon to trigger tiny tasks (area < 2000)
    const propsWithTinyTasks = {
      ...defaultProps,
      metadata: {
        ...defaultProps.metadata,
        taskGrid: {
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [
                  [[0, 0], [0.0001, 0], [0.0001, 0.0001], [0, 0.0001], [0, 0]] // extremely small area
                ]
              }
            }
          ]
        }
      }
    };

    setup(propsWithTinyTasks);
    
    const discardBtn = screen.getByText('Discard');
    expect(discardBtn).toBeInTheDocument();
    
    fireEvent.click(discardBtn);
    
    expect(defaultProps.updateMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ tasksNumber: 0 })
    );
  });
});
