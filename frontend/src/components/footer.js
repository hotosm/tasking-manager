import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from '@reach/router';
import { FormattedMessage } from 'react-intl';

import { TwitterIcon, FacebookIcon, YoutubeIcon, GithubIcon, InstagramIcon } from './svgIcons';
import messages from './messages';
import { getMenuItensForUser } from './header';
import {
  ORG_TWITTER,
  ORG_GITHUB,
  ORG_INSTAGRAM,
  ORG_FB,
  ORG_YOUTUBE,
  ORG_PRIVACY_POLICY_URL,
} from '../config';

const socialNetworks = [
  { link: ORG_TWITTER, icon: <TwitterIcon style={{ height: '20px', width: '20px' }} /> },
  { link: ORG_FB, icon: <FacebookIcon style={{ height: '20px', width: '20px' }} /> },
  { link: ORG_YOUTUBE, icon: <YoutubeIcon style={{ height: '20px', width: '20px' }} /> },
  { link: ORG_INSTAGRAM, icon: <InstagramIcon style={{ height: '20px', width: '20px' }} /> },
  { link: ORG_GITHUB, icon: <GithubIcon style={{ height: '20px', width: '20px' }} /> },
];

export function Footer({ location }: Object) {
  const userDetails = useSelector((state) => state.auth.get('userDetails'));

  const noFooterViews = ['tasks', 'map', 'validate', 'new', 'membership', 'api-docs'];
  const activeView = location.pathname
    .split('/')
    .filter((i) => i !== '')
    .splice(-1)[0];

  if (noFooterViews.includes(activeView)) {
    return <></>;
  } else {
    return (
      <footer className="ph3 ph6-l pb5 pt4 white bg-blue-dark">
        <div className="cf">
          <div className="pt2 w-50-l w-100 fl mb2 f3-l lh-title">
            <FormattedMessage {...messages.definition} />
          </div>
          <div className="pt2 mb2 w-50-l w-100 tl tr-l fr">
            {getMenuItensForUser(userDetails).map((item, n) => (
              <Link
                key={n}
                to={item.link}
                className="link barlow-condensed white f5 ttu di-l dib pt3 pt3-m ml4-l w-100 w-auto-l"
              >
                <FormattedMessage {...item.label} />
              </Link>
            ))}
            <p className="pt5-l pt4 pb3">
              {socialNetworks.map((item, n) => (
                <a
                  key={n}
                  href={item.link}
                  className="link barlow-condensed white f4 ttu di-l dib ph2"
                >
                  {item.icon}
                </a>
              ))}
            </p>
          </div>
        </div>
        <div className="cf">
          <div className="pt2 mb2 f7 w-50-l w-100 fl">
            <Link to={'about'} className="link white">
              <FormattedMessage {...messages.credits} />
            </Link>
            <div className="pt2 f7 lh-title">
              <a href={`https://${ORG_PRIVACY_POLICY_URL}`} className="link white">
                <FormattedMessage {...messages.privacyPolicy} />
              </a>
            </div>
          </div>
          <div className="pt2 f7 mb2 w-50-l w-100 tl tr-l fr">
            <a href="https://osm.org/about" className="link white pl1">
              <FormattedMessage {...messages.learn} />
            </a>
          </div>
        </div>
      </footer>
    );
  }
}
