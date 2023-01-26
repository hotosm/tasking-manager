import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';

import { Footer } from '..';
import { ReduxIntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
import { ORG_PRIVACY_POLICY_URL } from '../../../config';
import messages from '../../messages';

describe('Footer', () => {
  it('should display component details', () => {
    const { container } = renderWithRouter(
      <ReduxIntlProviders>
        <Footer />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText(messages.definition.defaultMessage)).toBeInTheDocument();
    ['Explore projects', 'Learn', 'About'].forEach((menuItem) =>
      expect(
        screen.getByRole('link', {
          name: menuItem,
        }),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByRole('img', {
        name: 'Creative Commons License',
      }),
    ).toHaveAttribute('src', 'https://i.creativecommons.org/l/by-sa/4.0/88x31.png');
    expect(
      screen.getByRole('link', {
        name: 'Creative Commons License',
      }),
    ).toHaveAttribute('href', 'https://creativecommons.org/licenses/by-sa/4.0/');
    expect(
      screen.getByRole('link', {
        name: messages.license.defaultMessage,
      }),
    ).toHaveAttribute('href', 'https://creativecommons.org/licenses/by-sa/4.0/');
    expect(
      screen.getByRole('link', {
        name: messages.credits.defaultMessage,
      }),
    ).toHaveAttribute('href', '/about');
    expect(
      screen.getByRole('link', {
        name: messages.privacyPolicy.defaultMessage,
      }),
    ).toBeInTheDocument();
    // 5 social icons + 1 external link icon
    expect(container.querySelectorAll('svg').length).toBe(6);
    ['Twitter', 'Facebook', 'YouTube', 'Instagram', 'GitHub'].forEach((socialLabel) =>
      expect(
        screen.getByRole('link', {
          name: socialLabel,
        }),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByRole('link', {
        name: messages.learn.defaultMessage,
      }),
    ).toHaveAttribute('href', 'https://osm.org/about');
  });

  it('should not display foooter for specified URLs', () => {
    const { container } = renderWithRouter(
      <ReduxIntlProviders>
        <Footer />
      </ReduxIntlProviders>,
      {
        route: 'manage/teams/new', // one of those links where footer is not expected
      },
    );
    expect(container).toBeEmptyDOMElement();
  });
});
