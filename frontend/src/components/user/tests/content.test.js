import { render, screen } from '@testing-library/react';
import { APIKeyCard } from '../content';
import userEvent from '@testing-library/user-event';
import { IntlProviders } from '../../../utils/testWithIntl';

test('should copy API key to the clipboard', async () => {
  const originalClipboard = { ...global.navigator.clipboard };
  const mockClipboard = {
    writeText: jest.fn().mockImplementation(() => Promise.resolve()),
  };
  global.navigator.clipboard = mockClipboard;
  const user = userEvent.setup();
  render(
    <IntlProviders>
      <APIKeyCard token="validToken" />
    </IntlProviders>,
  );
  await user.click(screen.getByRole('img'));
  expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Token validToken');
  jest.resetAllMocks();
  global.navigator.clipboard = originalClipboard;
});
