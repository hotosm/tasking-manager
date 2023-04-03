import React from 'react';
import { Tooltip } from 'react-tooltip';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { ORG_CODE } from '../../config';
import { createPopup } from '../../utils/login';
import { getTwitterLink, getLinkedInLink, getFacebookLink } from '../../utils/shareFunctions';
import { TwitterIconNoBg, FacebookIcon, LinkedinIcon, ShareIcon } from '../svgIcons';

export function ShareButton({ projectId }: Object) {
  const iconStyle = { width: '1.4em', height: '1.4em' };

  const twitterPopup = (message) =>
    createPopup(
      'twitter',
      getTwitterLink(message, window.location.href, [ORG_CODE, 'OpenStreetMap']),
    );

  const facebookPopup = (message) =>
    createPopup('facebook', getFacebookLink(message, window.location.href));

  const linkedInPopup = () => createPopup('linkedin', getLinkedInLink(window.location.href));

  return (
    <>
      <div className="flex items-center" data-tooltip-id="shareProjectTooltip">
        <ShareIcon className="pr2 blue-grey" />
        <span className="dn db-ns">
          <FormattedMessage {...messages.share} />
        </span>
      </div>
      <Tooltip delayHide={500} clickable={true} id="shareProjectTooltip" place={'top'}>
        <FormattedMessage
          {...messages.shareMessage}
          values={{ id: projectId, site: `${ORG_CODE} Tasking Manager` }}
        >
          {(msg) => (
            <>
              <div
                className="link no-underline base-font f6 pointer pv1"
                onClick={() => twitterPopup(msg)}
              >
                <TwitterIconNoBg style={iconStyle} className="light-blue v-mid pb1 pr2" />
                Tweet
              </div>
              <div
                className="link no-underline base-font f6 pointer pv1"
                onClick={() => facebookPopup(msg)}
              >
                <FacebookIcon style={iconStyle} className="dark-blue v-mid pb1 pr2" />
                <FormattedMessage {...messages.postOnFacebook} />
              </div>
            </>
          )}
        </FormattedMessage>
        <div className="link no-underline base-font f6 pointer pv1" onClick={() => linkedInPopup()}>
          <LinkedinIcon style={iconStyle} className="blue v-mid pb1 pr2" />
          <FormattedMessage {...messages.shareOnLinkedIn} />
        </div>
      </Tooltip>
    </>
  );
}
