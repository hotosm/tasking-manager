import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import HashtagPaste from '../hashtagPaste';
import userEvent from '@testing-library/user-event';

test('HashtagPaste with an empty text string', async () => {
  const setFn = jest.fn();
  const user = userEvent.setup();
  render(
    <ReduxIntlProviders>
      <HashtagPaste text="" setFn={setFn} hashtag="#managers" className="pt2 f6" />
    </ReduxIntlProviders>,
  );
  expect(screen.getByText('#managers').className).toBe('bb pointer pt2 f6');
  expect(screen.getByText('#managers').style.borderBottomStyle).toBe('dashed');
  expect(screen.getByText('#managers').title).toBeTruthy();
  await user.click(screen.getByText('#managers'));
  expect(setFn).toHaveBeenCalledWith('#managers ');
});

test('HashtagPaste with a text string', async () => {
  const setFn = jest.fn();
  const user = userEvent.setup();
  render(
    <ReduxIntlProviders>
      <HashtagPaste text="My comment" setFn={setFn} hashtag="#managers" className="pt2 f6" />
    </ReduxIntlProviders>,
  );
  expect(screen.getByText('#managers').className).toBe('bb pointer pt2 f6');
  expect(screen.getByText('#managers').style.borderBottomStyle).toBe('dashed');
  await user.click(screen.getByText('#managers'));
  expect(setFn).toHaveBeenCalledWith('My comment #managers');
});
