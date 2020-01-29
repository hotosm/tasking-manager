import React from 'react';
import { TwitterIconNoBg, FacebookIcon, EnvelopeIcon, LinkedinIcon } from '../svgIcons';
import { MappingLevelMessage } from '../mappingLevel';
import { NextMappingLevel } from '../user/settings';
import { FormattedMessage } from 'react-intl';
import messages from '../user/messages';

const SocialMedia = ({ data }) => {
  const socialMediaItems = ['emailAddress', 'twitterId', 'facebookId', 'linkedinId'];

  const getSocialIcon = field => {
    const iconStyle = {
      width: '1.4em',
      height: '1.4em',
    };

    switch (field) {
      case 'emailAddress':
        return <EnvelopeIcon style={iconStyle} className="red mr3" />;
      case 'twitterId':
        return <TwitterIconNoBg style={iconStyle} className="light-blue mr3" />;
      case 'facebookId':
        return <FacebookIcon style={iconStyle} className="dark-blue mr3" />;
      case 'linkedinId':
        return <LinkedinIcon style={iconStyle} className="blue mr3" />;
      default:
        return null;
    }
  };

  const createLink = (field, value) => {
    const aClass = 'blue-grey no-underline';
    let url = null;
    switch (field) {
      case 'emailAddress':
        return <span>{value}</span>;
      case 'twitterId':
        url = 'https://www.twitter.com/' + value;
        break;
      case 'facebookId':
        url = 'https://www.facebook.com/' + value;
        break;
      case 'linkedinId':
        url = 'https://www.linkedin.com/' + value;
        break;
      default:
        return null;
    }

    return (
      <a className={aClass} rel="noopener noreferrer" target="_blank" href={url}>
        {value}
      </a>
    );
  };

  return (
    <ul className="list pa0">
      {socialMediaItems.map(i => {
        if (data[i] === null) {
          return null;
        }

        return (
          <li key={i} className="dib mr3 cf f7">
            <div className="mr2 flex items-center">
              <div className="mr2 h2 flex items-center">
                {getSocialIcon(i)} {createLink(i, data[i])}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export const HeaderProfile = ({ user }) => {
  const details = user.details.read();
  const osm = user.osmDetails.read();

  const avatarClass = 'h4 w4 br-100 pa1 ba b--grey-light bw3 red';
  return (
    <div className="w-100 h-100 flex">
      <div className="mr4 tc">
        {details.pictureUrl ? (
          <img className={avatarClass} src={details.pictureUrl} alt={'hey'} />
        ) : (
          <div className={avatarClass + ' bg-light-gray ma1'}></div>
        )}
      </div>
      <div className="bg-white w-80">
        <div className="mb4">
          <p className="barlow-condensed f2 ttu b ma0 mb2">{details.name || details.username}</p>
          <p className="f4 ma0 mb2">
            <FormattedMessage
              {...messages.mapper}
              values={{
                level: <MappingLevelMessage level={details.mappingLevel} />,
              }}
            />
          </p>
          <NextMappingLevel changesetsCount={osm.changesetsCount} />
        </div>
        <SocialMedia data={details} />
      </div>
    </div>
  );
};
