import React, { useState, useEffect } from 'react';
import { FormattedMessage, FormattedNumber, FormattedRelative } from 'react-intl';

import messages from './messages';
import { UserAvatar } from './avatar';
import { MappingIcon, LinkIcon } from '../svgIcons';
import { Button } from '../button';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';

export function OSMCard({ username }: Object) {
  const [accountCreated, setAccountCreated] = useState(new Date());
  const [changesetCount, setChangesetCount] = useState(0);
  useEffect(() => {
    function handleStateChange(result) {
      setAccountCreated(result.accountCreated);
      setChangesetCount(result.changesetCount);
    }
    async function fetchData() {
      if (username) {
        return fetchLocalJSONAPI(`users/${username}/openstreetmap/`).then(result =>
          handleStateChange(result),
        );
      }
    }
    fetchData();
  }, [username]);

  return (
    <div className="cf bg-white shadow-4 pa4 mv4">
      <h3 className="f3 mt0 fw6">
        <FormattedMessage {...messages.osmCardTitle} />
      </h3>
      <div className="cf">
        <div className="fl w-30">
          <UserAvatar className="h3 w3 br-100 pa1" />
        </div>
        <div className="fl w-70 tr pl3 pt2 mt3">
          {/* it's interim while we get access to the correct icon */}
          <a
            href={`https://www.openstreetmap.org/user/${username}/account`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="blue-light bg-white link pt3 br1 f5 ba b--grey-light pointer">
              <FormattedMessage {...messages.changePicture} />{' '}
              <LinkIcon style={{ width: '13px', height: '13px' }} />
            </Button>
          </a>
        </div>
      </div>
      <div className="cf">
        <div className="w-50 fl">
          <h4 className="ttu blue-grey f5 fw4">
            <FormattedMessage {...messages.joinedOSM} />
          </h4>
          <p className="f4 fw8">
            <FormattedRelative value={accountCreated} />
          </p>
        </div>
        <div className="w-50 fl">
          <h4 className="ttu blue-grey f5 fw4">
            <FormattedMessage {...messages.totalChangesets} />
          </h4>
          <p className="f4 fw8">
            <FormattedNumber value={changesetCount} />
          </p>
        </div>
      </div>
      <div className="cf pt3">
        <div className="w-25 fl">
          <a
            className="link red"
            href={`https://www.openstreetmap.org/user/${username}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FormattedMessage {...messages.osmProfile} />
          </a>
        </div>
        <div className="w-25 fl">
          <a
            className="link red"
            href={`https://osmcha.mapbox.com/?filters={"users":[{"label":"${username}","value":"${username}"}]}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FormattedMessage {...messages.osmHistory} />
          </a>
        </div>
        <div className="w-50 fl">
          <a
            className="link red"
            href={`http://yosmhm.neis-one.org/?${username}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FormattedMessage {...messages.osmHeatMap} />
          </a>
        </div>
      </div>
    </div>
  );
}

export function WelcomeCard() {
  return (
    <div className="cf bg-white shadow-4 pa4 mb3">
      <h3 className="f2 mt0 fw6">
        <FormattedMessage {...messages.welcomeTitle} />
      </h3>
      <p>
        <FormattedMessage {...messages.interestsTitle} />
      </p>
      <p>
        <FormattedMessage {...messages.interestsLead} />
      </p>
    </div>
  );
}

export function HelpCard() {
  return (
    <div className="cf bg-white shadow-4 pa4">
      <h3 className="mt0">
        <FormattedMessage {...messages.helpTitle} />
      </h3>
      <p>
        <a href="help" className="link red pr4">
          <FormattedMessage {...messages.howToMap} />
        </a>
        <a href="help" className="link red pr4">
          <FormattedMessage {...messages.howToMapBuildings} />
        </a>
        <a href="help" className="link red">
          <FormattedMessage {...messages.whatIsOSM} />
        </a>
      </p>
    </div>
  );
}

export function FirstProjectBanner() {
  return (
    <div className="bg-white shadow-4 tc">
      <div className="pa4">
        <MappingIcon className="red" />
        <h3 className="f2 fw8">
          <FormattedMessage {...messages.firstProjectTitle} />
        </h3>
        <div className="lh-solid blue-grey f4">
          <p className="mv3">
            <FormattedMessage {...messages.firstProjectText1} />
          </p>
          <p className="mv3">
            <FormattedMessage {...messages.firstProjectText2} />
          </p>
          <p className="mv3 mw6" style={{ 'margin-left': 'auto', 'margin-right': 'auto' }}>
            <FormattedMessage {...messages.firstProjectText3} />
          </p>
        </div>
      </div>
    </div>
  );
}
