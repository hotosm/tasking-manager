import React from 'react';
import { Provider } from 'react-redux';
import { render, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { store } from '../../store';
import { ConnectedIntl } from '../../utils/internationalization';
import { ProjectStats } from '../projectStats';

describe('ProjectStats dashboard', () => {
  it('fetch urls and render information', async () => {
    const { container, findByText } = await render(
      <Provider store={store}>
        <ConnectedIntl>
          <ProjectStats id={1} />
        </ConnectedIntl>
      </Provider>,
    );

    await waitFor(() => screen.getByText('#1'));
    await waitFor(() => container.querySelector('[aria-valuenow="28"]'));
    
    expect(findByText('#1')).toBeTruthy();
    expect(findByText('Urgent')).toBeTruthy();
    expect(findByText('Tasks by status')).toBeTruthy();
    expect(findByText('Task statistics')).toBeTruthy();
    expect(findByText('Contributors')).toBeTruthy();
    expect(findByText('Project timeline')).toBeTruthy();
    expect(findByText('Time statistics')).toBeTruthy();
  }, 10000);
});
