import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SocialMedia } from '../headerProfile';
import { IntlProviders } from '../../../utils/testWithIntl';

let mockData = {
  id: 10291369,
  username: 'johndoe',
  slackId: 'johndoeSlack',
  twitterId: 'johndoeTwitter',
  facebookId: 'johndoeFacebook',
  linkedinId: 'johndoeLinkedin',
};

describe('SocialMedia component', () => {
  it('should render the correct number of icons', () => {
    const { container } = render(
      <IntlProviders>
        <SocialMedia data={mockData} />
      </IntlProviders>,
    );
    // img tag for OSM, Missng Maps and Slack
    expect(screen.getAllByRole('img')).toHaveLength(3);
    // SVGs for Facebook, Linkedin, Twitter
    expect(container.querySelectorAll('svg').length).toBe(3);
  });

  it('should render correct links', () => {
    render(
      <IntlProviders>
        <SocialMedia data={mockData} />
      </IntlProviders>,
    );
    expect(
      screen.getAllByRole('link', {
        name: 'johndoe',
      }),
    ).toHaveLength(2);
    expect(screen.queryAllByRole('link', { name: 'johndoe' })[0]).toHaveAttribute(
      'href',
      'https://www.openstreetmap.org/user/johndoe',
    );
    expect(screen.queryAllByRole('link', { name: 'johndoe' })[1]).toHaveAttribute(
      'href',
      'https://www.missingmaps.org/users/#/johndoe',
    );
    expect(screen.getByRole('link', { name: 'johndoeTwitter' })).toHaveAttribute(
      'href',
      'https://www.twitter.com/johndoeTwitter',
    );
    expect(screen.getByRole('link', { name: 'johndoeFacebook' })).toHaveAttribute(
      'href',
      'https://www.facebook.com/johndoeFacebook',
    );
    expect(screen.getByRole('link', { name: 'johndoeLinkedin' })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/johndoeLinkedin',
    );
  });

  it('should not render the Facebook icon and link for a falsy value', () => {
    mockData.facebookId = '';
    render(
      <IntlProviders>
        <SocialMedia data={mockData} />
      </IntlProviders>,
    );
    expect(
      screen.queryByRole('link', {
        name: 'johndoefacebook',
      }),
    ).not.toBeInTheDocument();
  });
});
