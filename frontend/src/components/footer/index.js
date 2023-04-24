import { Fragment } from 'react';
import { useSelector } from 'react-redux';
import { Link, matchRoutes, useLocation } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import {
  TwitterIcon,
  FacebookIcon,
  YoutubeIcon,
  GithubIcon,
  InstagramIcon,
  ExternalLinkIcon,
} from '../svgIcons';
import messages from '../messages';
import { getMenuItemsForUser } from '../header';
import {
  ORG_TWITTER,
  ORG_GITHUB,
  ORG_INSTAGRAM,
  ORG_FB,
  ORG_YOUTUBE,
  ORG_PRIVACY_POLICY_URL,
} from '../../config';
import './styles.scss';

const socialNetworks = [
  { link: ORG_TWITTER, icon: <TwitterIcon style={{ height: '20px', width: '20px' }} /> },
  { link: ORG_FB, icon: <FacebookIcon style={{ height: '20px', width: '20px' }} /> },
  { link: ORG_YOUTUBE, icon: <YoutubeIcon style={{ height: '20px', width: '20px' }} /> },
  { link: ORG_INSTAGRAM, icon: <InstagramIcon style={{ height: '20px', width: '20px' }} /> },
  { link: ORG_GITHUB, icon: <GithubIcon style={{ height: '20px', width: '20px' }} /> },
];

export function Footer() {
  const location = useLocation();
  const userDetails = useSelector((state) => state.auth.userDetails);

  const footerDisabledPaths = [
    'projects/:id/tasks',
    'projects/:id/map',
    'projects/:id/validate',
    'manage/organisations/new/',
    'manage/teams/new',
    'manage/campaigns/new',
    'manage/projects/new',
    'manage/categories/new',
    'manage/licenses/new',
    'teams/:id/membership',
    '/api-docs/',
  ];

  const matchedRoute = matchRoutes(
    footerDisabledPaths.map((path) => ({
      path,
    })),
    location,
  );

  if (matchedRoute) {
    return null;
  } else {
    return (
      <footer className="ph3 ph6-l pb4 white bg-blue-dark">
        <div className="footer-ctr-top flex justify-between flex-column flex-row-ns">
          <p className="ma0 f5 f3-ns lh-title">
            <FormattedMessage {...messages.definition} />
          </p>
          <div className="menuItems">
            {getMenuItemsForUser(userDetails).map((item) => (
              <Fragment key={item.label.id}>
                {!item.serviceDesk ? (
                  <Link
                    to={item.link}
                    className="link barlow-condensed white f5 fw5 ttu di-l dib ml4-l w-100 w-auto-l nowrap"
                  >
                    <FormattedMessage {...item.label} />
                  </Link>
                ) : (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="link barlow-condensed white f5 fw5 ttu di-l dib ml4-l w-100 w-auto-l nowrap"
                  >
                    <FormattedMessage {...item.label} />
                    <ExternalLinkIcon className="pl2 v-cen" style={{ height: '11px' }} />
                  </a>
                )}
              </Fragment>
            ))}
          </div>
        </div>
        <div className="flex justify-between flex-column flex-row-ns">
          <div className="pt2 mb2 f6 w-50-l w-100">
            <div className="pb3 lh-title mw6">
              <a rel="license" href="https://creativecommons.org/licenses/by-sa/4.0/">
                <img
                  className="mb1"
                  src="https://i.creativecommons.org/l/by-sa/4.0/88x31.png"
                  alt="Creative Commons License"
                />
              </a>
              <br />
              <a
                className="link white"
                href="https://creativecommons.org/licenses/by-sa/4.0/"
                rel="license"
              >
                <FormattedMessage {...messages.license} />
              </a>
            </div>
            <Link to={'about'} className="link white">
              <FormattedMessage {...messages.credits} />
            </Link>
            {ORG_PRIVACY_POLICY_URL && (
              <div className="pt2 f6 lh-title">
                <a href={`${ORG_PRIVACY_POLICY_URL}`} className="link white">
                  <FormattedMessage {...messages.privacyPolicy} />
                </a>
              </div>
            )}
          </div>
          <div className="pt2 f6 mb2 w-50-l w-100 tl tr-l self-end flex flex-column items-start items-end-ns ">
            <p className="pb3 flex socials">
              {socialNetworks
                .filter((item) => item.link)
                .map((item, n) => (
                  <a
                    key={n}
                    href={item.link}
                    className="link barlow-condensed white f4 ttu di-l dib"
                  >
                    {item.icon}
                  </a>
                ))}
            </p>
            <a href="https://osm.org/about" className="link white">
              <FormattedMessage {...messages.learn} />
            </a>
          </div>
        </div>
      </footer>
    );
  }
}
