import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { IntlProviders } from '../../utils/testWithIntl';
import messages from '../messages';
import { NotFound } from '../notFound';

describe('Not Found', () => {
  it('should display project not found error', () => {
    render(
      <IntlProviders>
        <NotFound projectId={123} />
      </IntlProviders>,
    );
    expect(
      screen.getByRole('heading', {
        name: 'Project 123 not found',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(messages.notFoundLead.defaultMessage)).toBeInTheDocument();
  });

  it('should display page not found error', () => {
    render(
      <IntlProviders>
        <NotFound />
      </IntlProviders>,
    );
    expect(
      screen.queryByRole('heading', {
        name: 'Project 123 not found',
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: messages.pageNotFound.defaultMessage,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(messages.notFoundLead.defaultMessage)).toBeInTheDocument();
  });
});
