import { render, screen } from '@testing-library/react';
import Paginator from '../paginator';
import userEvent from '@testing-library/user-event';

test('should set the active page', async () => {
  const setInboxQueryMock = jest.fn();
  render(
    <Paginator
      inboxQuery={{ page: 1 }}
      notifications={{
        pagination: {
          pages: 3,
        },
      }}
      setInboxQuery={setInboxQueryMock}
    />,
  );
  const user = userEvent.setup();
  await user.click(
    screen.getByRole('button', {
      name: /2/i,
    }),
  );
  expect(setInboxQueryMock).toBeCalledWith({ page: 2 }, 'pushIn');
});
