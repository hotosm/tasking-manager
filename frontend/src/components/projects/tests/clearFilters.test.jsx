import ClearFilters from '../clearFilters';
import { IntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
import { cleanup, screen } from '@testing-library/react';
import messages from '../../contributions/messages';

describe('ClearFilters basic properties', () => {
  beforeEach(() =>
    renderWithRouter(
      <IntlProviders>
        <ClearFilters url="/explore" />
      </IntlProviders>,
    ),
  );
  it('is a link and point to the correct place', async () => {
    expect(await screen.findByRole('link')).toBeInTheDocument();
    expect(await screen.findByRole('link')).toHaveAttribute('href', '/explore');
  });
  it('has a FormattedMessage children with the correct id', async () => {
    expect(await screen.findByText(messages.clearFilters.defaultMessage)).toBeInTheDocument();
  });
  it('has the correct className', async () => {
    expect((await screen.findByRole('link')).className).toBe('red link ph3 pv2 f6 ');
  });
  it('has the correct className when given additional className props', async () => {
    cleanup();
    renderWithRouter(
      <IntlProviders>
        <ClearFilters url="/explore" className="dib mt2" />
      </IntlProviders>,
    );
    expect((await screen.findByRole('link')).className).toBe('red link ph3 pv2 f6 dib mt2');
  });
});
