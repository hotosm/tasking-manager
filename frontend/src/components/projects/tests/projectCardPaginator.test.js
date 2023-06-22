import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ProjectCardPaginator } from '../projectCardPaginator';

describe('ProjectCardPaginator Component', () => {
  const setQueryParamMock = jest.fn();
  it('shows the pagination controls', () => {
    render(
      <ProjectCardPaginator
        projectAPIstate={{
          isLoading: false,
          isError: false,
          tasks: [],
          pagination: {
            hasNext: true,
            hasPrev: false,
            page: 1,
            pages: 3,
          },
        }}
      />,
    );
    expect(screen.getAllByRole('button').length).toEqual(3);
  });

  it('should set query on the button click', async () => {
    const user = userEvent.setup();
    render(
      <ProjectCardPaginator
        setQueryParam={setQueryParamMock}
        projectAPIstate={{
          isLoading: false,
          isError: false,
          tasks: [],
          pagination: {
            hasNext: true,
            hasPrev: false,
            page: 1,
            pages: 3,
          },
        }}
      />,
    );
    await user.click(
      screen.getByRole('button', {
        name: '2',
      }),
    );
    expect(setQueryParamMock).toHaveBeenCalled();
  });

  it('should render nothing if no pagination detail is provided', async () => {
    const { container } = render(
      <ProjectCardPaginator
        projectAPIstate={{
          pagination: null,
        }}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
