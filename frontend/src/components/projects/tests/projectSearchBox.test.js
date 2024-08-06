import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { IntlProviders } from '../../../utils/testWithIntl';
import { ProjectSearchBox } from '../projectSearchBox';

describe('ProjectSearchBox', () => {
  it('should set the query as the state', async () => {
    const setQueryMock = jest.fn();
    const user = userEvent.setup();
    render(
      <IntlProviders>
        <ProjectSearchBox fullProjectsQuery={{}} setQuery={setQueryMock} />
      </IntlProviders>,
    );
    const textfield = screen.getByRole('textbox');
    await user.type(textfield, 'something');
    expect(setQueryMock).toHaveBeenCalled();
  });

  it('should clear the query when the close icon is clicked', async () => {
    const setQueryMock = jest.fn();
    const user = userEvent.setup();
    render(
      <IntlProviders>
        <ProjectSearchBox fullProjectsQuery={{ text: 'something' }} setQuery={setQueryMock} />
      </IntlProviders>,
    );
    await user.click(screen.getByRole('button'));
    expect(setQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        text: undefined,
        page: undefined,
      }),
      'pushIn',
    );
  });

  it('should focus the textbox when search icon is clicked', async () => {
    const setQueryMock = jest.fn();
    const user = userEvent.setup();
    render(
      <IntlProviders>
        <ProjectSearchBox fullProjectsQuery={{ text: 'something' }} setQuery={setQueryMock} />
      </IntlProviders>,
    );
    const textfield = screen.getByRole('textbox');
    expect(textfield).not.toHaveFocus();
    await user.click(screen.getByLabelText('Search'));
    expect(textfield).toHaveFocus();
  });
});
