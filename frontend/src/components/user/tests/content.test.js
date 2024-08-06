import { render, screen, waitFor } from '@testing-library/react';
import { APIKeyCard } from '../content';
import userEvent from '@testing-library/user-event';
import { IntlProviders } from '../../../utils/testWithIntl';

test('should copy API key to the clipboard', async () => {
  const user = userEvent.setup({ writeToClipboard: true });
  render(
    <IntlProviders>
      <APIKeyCard token="validToken" />
    </IntlProviders>,
  );
  await user.click(screen.getByRole('img'));
  await waitFor(async () => expect(await navigator.clipboard.readText()).toBe('Token validToken'));
});
