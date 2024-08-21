import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';

import { Footer } from '..';
import { ReduxIntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
import {
  ORG_TWITTER,
  ORG_GITHUB,
  ORG_INSTAGRAM,
  ORG_FB,
  ORG_YOUTUBE,
  ORG_PRIVACY_POLICY_URL,
  SERVICE_DESK,
} from '../../../config';
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
    let socialLinksCount = 0;
    [
      {
        name: 'Twitter',
        link: ORG_TWITTER,
      },
      {
        name: 'GitHub',
        link: ORG_GITHUB,
      },
      {
        name: 'Instagram',
        link: ORG_INSTAGRAM,
      },
      {
        name: 'Facebook',
        link: ORG_FB,
      },
      {
        name: 'YouTube',
        link: ORG_YOUTUBE,
      },
    ].forEach((social) => {
      if (social.link) {
        expect(
          screen.getByRole('link', {
            name: social.name,
          }),
        ).toHaveAttribute('href', social.link);
        socialLinksCount += 1;
      } else {
        expect(
          screen.queryByRole('link', {
            name: social.name,
          }),
        ).not.toBeInTheDocument();
      }
    });
    if (ORG_PRIVACY_POLICY_URL) {
      expect(
        screen.getByRole('link', {
          name: messages.privacyPolicy.defaultMessage,
        }),
      ).toHaveAttribute('href', `${ORG_PRIVACY_POLICY_URL}`);
    } else {
      expect(
        screen.queryByRole('link', {
          name: messages.privacyPolicy.defaultMessage,
        }),
      ).not.toBeInTheDocument();
    }
    if (SERVICE_DESK) {
      expect(
        screen.getByRole('link', {
          name: 'Support',
        }),
      ).toBeInTheDocument();
      expect(container.querySelectorAll('svg').length).toBe(socialLinksCount + 1);
    } else {
      expect(
        screen.queryByRole('link', {
          name: 'Support',
        }),
      ).not.toBeInTheDocument();
      expect(container.querySelectorAll('svg').length).toBe(socialLinksCount);
    }
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
