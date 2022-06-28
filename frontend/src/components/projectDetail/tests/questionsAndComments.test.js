import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { store } from '../../../store';

import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import { QuestionsAndComments, PostProjectComment } from '../questionsAndComments';

describe('test if QuestionsAndComments component', () => {
  it('only renders text asking user to log in for non-logged in user', () => {
    render(
      <ReduxIntlProviders store={store}>
        <QuestionsAndComments projectId={1} />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('Log in to be able to post comments.')).toBeInTheDocument();
  });

  it('renders tabs for writing and previewing comments', () => {
    render(
      <ReduxIntlProviders store={store}>
        <PostProjectComment projectId={1} />
      </ReduxIntlProviders>,
    );
    const previewBtn = screen.getByRole('button', { name: /preview/i });
    expect(screen.getAllByRole('button').length).toBe(3);
    expect(screen.getByRole('button', { name: /write/i })).toBeInTheDocument();
    expect(previewBtn).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    fireEvent.click(previewBtn);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText(/nothing to preview/i)).toBeInTheDocument();
  });

  it('enables logged in user to post and view comments', async () => {
    jest.spyOn(window, 'fetch');
    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: '123456' });
    });
    render(
      <ReduxIntlProviders store={store}>
        <QuestionsAndComments projectId={1} />
      </ReduxIntlProviders>,
    );

    window.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        chat: [
          {
            message: '<p>Test comment</p>',
            pictureUrl: null,
            timestamp: Date.now() - 1e3,
            username: 'TestUser',
            length: 1,
          },
        ],
        pagination: {
          hasNext: false,
          hasPrev: false,
          nextNum: null,
          page: 1,
          pages: 1,
          perPage: 5,
        },
      }),
    });
    expect(
      screen.queryByText(
        'There are currently no questions or comments on this project. Be the first to post one!',
      ),
    ).toBeInTheDocument();
    const textarea = screen.getByRole('textbox');
    expect(textarea.textContent).toBe('');
    const button = screen.getByRole('button', { name: /post/i });
    expect(button.textContent).toBe('Post');

    // type comment in textbox
    fireEvent.change(textarea, { target: { value: 'Test comment' } });
    expect(textarea.textContent).toBe('Test comment');
    expect(
      screen.queryByTitle('Add "#managers" to notify the project managers about your comment.')
        .textContent,
    ).toBe('#managers');
    expect(
      screen.queryByTitle('Add "#author" to notify the project author about your comment.')
        .textContent,
    ).toBe('#author');

    // click button to post comment
    fireEvent.click(button);
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
    expect(screen.getByRole('link').href).toContain('/users/TestUser');
    expect(screen.getByRole('link').textContent).toBe('TestUser');
    expect(screen.getByText('Test comment')).toBeInTheDocument(); //posted comment
    expect(screen.getByText('1 second ago')).toBeInTheDocument(); //time posted
    expect(screen.getByText('1')).toBeInTheDocument(); //page button
    expect(screen.getByText('Message sent.')).toBeInTheDocument();
    expect(textarea.textContent).toBe(''); //empty textarea
    expect(
      screen.queryByText(
        'There are currently no questions or comments on this project. Be the first to post one!',
      ),
    ).not.toBeInTheDocument();
  });
});
