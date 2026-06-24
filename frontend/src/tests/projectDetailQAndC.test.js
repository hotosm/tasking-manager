import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { store } from '../store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { QuestionsAndComments, CommentList } from '../components/projectDetail/questionsAndComments';

import { useCommentsQuery } from '../api/questionsAndComments';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const Wrapper = ({ children }) => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <IntlProvider locale="en">
        {children}
      </IntlProvider>
    </QueryClientProvider>
  </Provider>
);

// Mock the API hooks
jest.mock('../api/questionsAndComments', () => ({
  useCommentsQuery: jest.fn(),
  postProjectComment: jest.fn(),
}));

describe('QuestionsAndComments component', () => {
  const mockProject = { projectId: 123, projectInfo: { name: 'Test' } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    useCommentsQuery.mockReturnValue({ status: 'loading', data: null, refetch: jest.fn() });
    const { container } = render(
      <QuestionsAndComments project={mockProject} contributors={[]} titleClass="test-class" />,
      { wrapper: Wrapper }
    );
    expect(screen.getByText(/Questions and Comments/i)).toBeInTheDocument();
  });

  it('renders error state correctly', () => {
    useCommentsQuery.mockReturnValue({ status: 'error', data: null, refetch: jest.fn() });
    render(
      <QuestionsAndComments project={mockProject} contributors={[]} titleClass="test-class" />,
      { wrapper: Wrapper }
    );
    expect(screen.getByText(/An error occurred while loading comments/i)).toBeInTheDocument();
  });

  it('renders empty comments state correctly', () => {
    useCommentsQuery.mockReturnValue({ 
      status: 'success', 
      data: { chat: [], pagination: { pages: 0 } }, 
      refetch: jest.fn() 
    });
    render(
      <QuestionsAndComments project={mockProject} contributors={[]} titleClass="test-class" />,
      { wrapper: Wrapper }
    );
    expect(screen.getByText(/There are no comments yet/i)).toBeInTheDocument();
  });
});

describe('CommentList component', () => {
  const mockComments = [
    {
      id: 1,
      username: 'user1',
      pictureUrl: 'pic1.jpg',
      timestamp: '2023-10-01T12:00:00Z',
      message: 'Hello world'
    },
    {
      id: 2,
      username: 'user2',
      pictureUrl: 'pic2.jpg',
      timestamp: '2023-10-02T12:00:00Z',
      message: 'Another comment'
    }
  ];

  it('renders a list of comments', () => {
    render(
      <CommentList 
        userCanEditProject={false} 
        projectId={123} 
        comments={mockComments} 
        retryFn={jest.fn()} 
      />,
      { wrapper: Wrapper }
    );
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('user2')).toBeInTheDocument();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.getByText('Another comment')).toBeInTheDocument();
  });
});
