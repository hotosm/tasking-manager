
import userEvent from '@testing-library/user-event';
import { render, screen, act, waitFor, within } from '@testing-library/react';

import { store } from '../../../store';

import {
  QueryClientProviders,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../../utils/testWithIntl';
import { getProjectSummary, projectComments } from '../../../network/tests/mockData/projects';
import { QuestionsAndComments, PostProjectComment, CommentList } from '../questionsAndComments';
// This is a late import in a React.lazy call; it takes awhile for commentInput to load
import '../../comments/commentInput';

describe('test if QuestionsAndComments component', () => {
  const project = getProjectSummary(1);
  it('only renders text asking user to log in for non-logged in user', () => {
    render(
      <QueryClientProviders>
        <ReduxIntlProviders store={store}>
          <QuestionsAndComments project={project} />
        </ReduxIntlProviders>
      </QueryClientProviders>,
    );
    expect(screen.getByText('Log in to be able to post comments.')).toBeInTheDocument();
  });

  it('renders tabs for writing and previewing comments', async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProviders>
        <ReduxIntlProviders store={store}>
          <PostProjectComment projectId={1} />
        </ReduxIntlProviders>
      </QueryClientProviders>,
    );
    const previewBtn = await screen.findByRole('button', { name: /preview/i }, {
      timeout: 5000,
    })
    expect(screen.getAllByRole('button').length).toBe(11);
    waitFor(() => expect(screen.getByRole('button', { name: /write/i })));
    expect(screen.getAllByRole('button')).toHaveLength(11);
    waitFor(() => (screen.getByRole('textbox')));
    await user.click(previewBtn);
    expect(screen.queryByRole('textbox', { hidden: true })).toBeInTheDocument();
    expect(await screen.findByText(/nothing to preview/i)).toBeInTheDocument();
  });

  it('enables logged in user to post and view comments', async () => {
    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: '123456', role: 'ADMIN' });
    });
    const { user } = renderWithRouter(
      <QueryClientProviders>
        <ReduxIntlProviders store={store}>
          <QuestionsAndComments project={project} />
        </ReduxIntlProviders>
      </QueryClientProviders>,
    );
    expect(await screen.findByText('hello world')).toBeInTheDocument();
    const textarea = screen.getByRole('textbox');
    const postBtn = screen.getByRole('button', { name: /post/i });
    await user.type(textarea, 'Test comment');
    await user.click(postBtn);
    await waitFor(() => expect(screen.getByText(/Message sent./i)).toBeInTheDocument());
    expect(textarea).toHaveTextContent('');
  });

  it('should delete the comment', async () => {
    const retryFnMock = vi.fn();
    store.dispatch({
      type: 'SET_USER_DETAILS',
      userDetails: { role: 'ADMIN' },
    });
    const { user } = renderWithRouter(
      <ReduxIntlProviders store={store}>
        <CommentList
          userCanEditProject
          projectId={123}
          comments={projectComments.chat}
          retryFn={retryFnMock}
        />
      </ReduxIntlProviders>,
    );

    await waitFor(() => expect(screen.getByText('hello world')).toBeInTheDocument());
    await user.click(screen.getAllByRole('button')[0]);
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(retryFnMock).toHaveBeenCalledTimes(1));
  });
});
