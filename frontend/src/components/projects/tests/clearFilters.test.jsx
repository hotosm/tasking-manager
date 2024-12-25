import { FormattedMessage } from 'react-intl';

import ClearFilters from '../clearFilters';
import { createComponentWithIntl, IntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
import { MemoryRouter } from 'react-router-dom';
import { screen } from '@testing-library/react';
import messages from "../../contributions/messages";

describe('ClearFilters basic properties', () => {
  beforeEach(() => renderWithRouter(
    <IntlProviders>
      <ClearFilters url="/explore" />
    </IntlProviders>,
  ));
  it('is a link and point to the correct place', async () => {
    expect(await screen.findByRole('link')).toBeInTheDocument();
    expect(await screen.findByRole('link')).toHaveAttribute('href', '/explore');
    expect(await screen.findByText(messages.clearFilters.defaultMessage)).toBeInTheDocument();
  });
  it('has a FormattedMessage children with the correct id', () => {
    screen.debug();
  });
  it('has the correct className', () => {
    expect(testInstance.findByType('a').props.className).toBe('red link ph3 pv2 f6 ');
    const element2 = createComponentWithIntl(
      <MemoryRouter>
        <ClearFilters url="/explore" className="dib mt2" />
      </MemoryRouter>,
    );
    const testInstance2 = element2.root;
    expect(testInstance2.findByType('a').props.className).toBe('red link ph3 pv2 f6 dib mt2');
  });
});
