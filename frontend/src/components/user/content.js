import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FormattedMessage, FormattedNumber, FormattedRelativeTime } from 'react-intl';
import { selectUnit } from '../../utils/selectUnit';
import ReactPlaceholder from 'react-placeholder';
import { OSM_SERVER_URL } from '../../config';

import messages from './messages';
import { MappingIcon, ClipboardIcon } from '../svgIcons';
import { UserInterestsForm } from './forms/interests';

export function APIKeyCard({ token }) {
  const handleClick = () => navigator.clipboard.writeText(`Token ${token}`);

  const link = (
    <a className="link red underline-hover" href="/api-docs/" target="_blank">
      <FormattedMessage {...messages.apiDocs} />
    </a>
  );

  return (
    <div className="cf bg-white b--card ba br1 pa4 mb3">
      <h3 className="f3 blue-dark mt0 fw7">
        <FormattedMessage {...messages.apiKey} />
      </h3>
      <div className="flex items-center">
        <p className="f5 di bg-tan blue-grey pa2 break-all-word ma0">Token {token}</p>
        <span className="pointer pl2 blue-light hover-blue-dark di" title="Copy Token">
          <ClipboardIcon width="18px" height="18px" onClick={handleClick} />
        </span>
      </div>
      <p className="f5 blue-grey pt2 lh-base mt2">
        <FormattedMessage {...messages.apiKeyDescription} values={{ link: link }} />
      </p>
    </div>
  );
}

export function OSMCard({ username }: Object) {
  const osmUserInfo = useSelector((state) => state.auth.osm);
  const { value, unit } = selectUnit(
    osmUserInfo ? new Date(osmUserInfo.accountCreated) : new Date(),
  );
  return (
    <div className="cf bg-white b--card ba br1 pa4 mb3">
      <h3 className="f3 blue-dark mt0 fw7">
        <FormattedMessage {...messages.osmCardTitle} />
      </h3>
      <div className="cf">
        <div className="w-100 w-50-ns fl mb3">
          <h4 className="ttu blue-grey f6 fw5 mt1 mb0 lh-base">
            <FormattedMessage {...messages.joinedOSM} />
          </h4>
          <div title={osmUserInfo && osmUserInfo.accountCreated} className="f4 blue-dark fw7 mv2">
            <ReactPlaceholder
              showLoadingAnimation={true}
              rows={1}
              delay={100}
              ready={typeof osmUserInfo !== 'undefined'}
            >
              <FormattedRelativeTime value={value} unit={unit} />
            </ReactPlaceholder>
          </div>
        </div>
        <div className="w-100 w-50-ns fl mb3">
          <h4 className="ttu blue-grey f6 fw5 mt1 mb0 lh-base">
            <FormattedMessage {...messages.totalChangesets} />
          </h4>
          <div className="f4 blue-dark fw8 mv2">
            <ReactPlaceholder
              showLoadingAnimation={true}
              rows={1}
              delay={100}
              ready={typeof osmUserInfo !== 'undefined'}
            >
              <FormattedNumber value={osmUserInfo ? osmUserInfo.changesetCount : 0} />
            </ReactPlaceholder>
          </div>
        </div>
      </div>
      <div className="cf pt1">
        <div className="w-100 w-50-ns fl">
          <a
            className="link red pb2 fw5 underline-hover"
            href={`${OSM_SERVER_URL}/user/${username}/account`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FormattedMessage {...messages.editOSMProfile} />
          </a>
        </div>
        <div className="w-100 w-50-ns fl mt2 mt0-ns">
          <a
            className="link red pb2 fw5 underline-hover"
            href={`https://osmcha.org/?filters={"users":[{"label":"${username}","value":"${username}"}]}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FormattedMessage {...messages.osmHistory} />
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
      <UserInterestsForm />
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
        <Link to={'/learn/map'} className="link red mr4">
          <FormattedMessage {...messages.howToMap} />
        </Link>
        <Link to={'/learn/quickstart'} className="link red mr4">
          <FormattedMessage {...messages.quickStart} />
        </Link>
        <a
          href="https://learnosm.org/en/beginner/start-osm/"
          target="_blank"
          rel="noopener noreferrer"
          className="link red"
        >
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
        <h3 className="f2 fw8 mt2 mb4">
          <FormattedMessage {...messages.firstProjectTitle} />
        </h3>
        <div className="lh-solid blue-grey f4">
          <p className="mv3">
            <FormattedMessage {...messages.firstProjectText1} />
          </p>
          <p className="mv3">
            <FormattedMessage {...messages.firstProjectText2} />
          </p>
          <p className="mv3 mw6" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
            <FormattedMessage {...messages.firstProjectText3} />
          </p>
        </div>
      </div>
    </div>
  );
}
