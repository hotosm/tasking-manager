import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import HashtagPaste from '../hashtagPaste';

test('HashtagPaste with an empty text string', () => {
  const setFn = jest.fn();
  render(
    <ReduxIntlProviders>
      <HashtagPaste text="" setFn={setFn} hashtag="#managers" className="pt2 f6" />
    </ReduxIntlProviders>,
  );
  expect(screen.getByText('#managers').className).toBe('bb pointer pt2 f6');
  expect(screen.getByText('#managers').style.borderBottomStyle).toBe('dashed');
  expect(screen.getByText('#managers').title).toBeTruthy();
  fireEvent.click(screen.getByText('#managers'));
  expect(setFn).toHaveBeenCalledWith('#managers ');
});

test('HashtagPaste with a text string', () => {
  const setFn = jest.fn();
  render(
    <ReduxIntlProviders>
      <HashtagPaste text="My comment" setFn={setFn} hashtag="#managers" className="pt2 f6" />
    </ReduxIntlProviders>,
  );
  expect(screen.getByText('#managers').className).toBe('bb pointer pt2 f6');
  expect(screen.getByText('#managers').style.borderBottomStyle).toBe('dashed');
  fireEvent.click(screen.getByText('#managers'));
  expect(setFn).toHaveBeenCalledWith('My comment #managers');
});
