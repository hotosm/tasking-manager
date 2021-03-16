import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import { AddToFavorites } from '../favorites';

describe('AddToFavorites button', () => {
  it('renders button when project id = 1', async () => {
    const props = {
      projectId: 1,
    };
    const { container } = render(
      <ReduxIntlProviders>
        <AddToFavorites {...props} />
      </ReduxIntlProviders>,
    );
    const button = screen.getByRole('button');
    expect(button.className).toBe(' input-reset base-font bg-white blue-dark f6 bn pointer');
    expect(button.className).not.toBe('dn input-reset base-font bg-white blue-dark f6 bn pointer');
    expect(container.querySelector('svg').classList.value).toBe('pt3 pr2 v-btm o-50 ');
    expect(button.textContent).toBe('Add to Favorites');
  });
});
