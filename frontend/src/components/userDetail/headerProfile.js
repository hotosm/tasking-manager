import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from '../user/messages';
import { TwitterIconNoBg, FacebookIcon, LinkedinIcon, ProfilePictureIcon } from '../svgIcons';
import { MappingLevelMessage } from '../mappingLevel';
import { NextMappingLevel } from '../user/settings';

const SocialMedia = ({ data }) => {
  const socialMediaItems = ['twitterId', 'facebookId', 'linkedinId'];

  const getSocialIcon = field => {
    const iconStyle = {
      width: '1.4em',
      height: '1.4em',
    };

    switch (field) {
      case 'twitterId':
        return <TwitterIconNoBg style={iconStyle} className="light-blue v-mid" />;
      case 'facebookId':
        return <FacebookIcon style={iconStyle} className="dark-blue v-mid" />;
      case 'linkedinId':
        return <LinkedinIcon style={iconStyle} className="blue v-mid" />;
      default:
        return null;
    }
  };

  const createLink = (field, value) => {
    const aClass = 'blue-grey no-underline';
    let url = null;
    switch (field) {
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
          <li key={i} className="dib mr4-ns mr2 cf f7">
            <div className="mr2 h2">
              {getSocialIcon(i)} {createLink(i, data[i])}
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export const HeaderProfile = ({ userDetails, changesets }) => {
  const avatarClass = 'h4 w4 br-100 pa1 ba b--grey-light bw3 red';
  return (
    <div className="w-100 h-100 cf">
      <div className="fl dib mr3">
        {userDetails.pictureUrl ? (
          <img className={avatarClass} src={userDetails.pictureUrl} alt={'hey'} />
        ) : (
          <ProfilePictureIcon className="red" />
        )}
      </div>
      <div className="pl2 dib">
        <div className="mb4">
          <p className="barlow-condensed f2 ttu b ma0 mb2">
            {userDetails.name || userDetails.username}
          </p>
          <p className="f4 ma0 mb2">
            <FormattedMessage
              {...messages.mapper}
              values={{
                level: <MappingLevelMessage level={userDetails.mappingLevel} />,
              }}
            />
          </p>
          <NextMappingLevel changesetsCount={changesets} />
        </div>
        <SocialMedia data={userDetails} />
      </div>
    </div>
  );
};
