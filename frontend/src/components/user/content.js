import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from '@reach/router';
import { FormattedMessage, FormattedNumber, FormattedRelativeTime } from 'react-intl';
import { selectUnit } from '@formatjs/intl-utils';
import { useCopyClipboard } from '@lokibai/react-use-copy-clipboard';
import ReactPlaceholder from 'react-placeholder';
import { OSM_SERVER_URL } from '../../config';

import messages from './messages';
import { MappingIcon, ClipboardIcon } from '../svgIcons';
import { UserInterestsForm } from './forms/interests';

export function APIKeyCard({ token }) {
  //eslint-disable-next-line
  const [isCopied, setCopied] = useCopyClipboard();

  const handleClick = () => {
    setCopied(`Token ${token}`);
  };
  const link = (
    <a className="link red" href="/api-docs/" target="_blank">
      <FormattedMessage {...messages.apiDocs} />
    </a>
  );
  return (
    <div className="cf bg-white shadow-4 pa4 mb3">
      <h3 className="f3 blue-dark mt0 fw6">
        <FormattedMessage {...messages.apiKey} />
      </h3>
      <div className="cf">
        <pre className="f6 di bg-tan blue-grey pa2">Token {token}</pre>
        <span className="pointer pl2 blue-light hover-blue-dark di" title="Copy Token">
          <ClipboardIcon width="18px" height="18px" onClick={handleClick} />
        </span>
        <p className="f6 blue-grey pt3">
          <FormattedMessage {...messages.apiKeyDescription} values={{ link: link }} />
        </p>
      </div>
    </div>
  );
}

export function OSMCard({ username }: Object) {
  const osmUserInfo = useSelector((state) => state.auth.get('osm'));
  const { value, unit } = selectUnit(
    osmUserInfo ? new Date(osmUserInfo.accountCreated) : new Date(),
  );
  return (
    <div className="cf bg-white shadow-4 pa4 mb3">
      <h3 className="f3 blue-dark mt0 fw6">
        <FormattedMessage {...messages.osmCardTitle} />
      </h3>
      <div className="cf">
        <div className="w-50 fl">
          <h4 className="ttu blue-grey f5 fw4 mt1 mb0">
            <FormattedMessage {...messages.joinedOSM} />
          </h4>
          <div title={osmUserInfo && osmUserInfo.accountCreated} className="f4 blue-dark fw8 mv3">
            <ReactPlaceholder
              showLoadingAnimation={true}
              rows={1}
              delay={100}
              ready={typeof osmUserInfo !== undefined}
            >
              <FormattedRelativeTime value={value} unit={unit} />
            </ReactPlaceholder>
          </div>
        </div>
        <div className="w-50 fl">
          <h4 className="ttu blue-grey f5 fw4 mt1 mb0">
            <FormattedMessage {...messages.totalChangesets} />
          </h4>
          <div className="f4 blue-dark fw8 mv3">
            <ReactPlaceholder
              showLoadingAnimation={true}
              rows={1}
              delay={100}
              ready={typeof osmUserInfo !== undefined}
            >
              <FormattedNumber value={osmUserInfo ? osmUserInfo.changesetCount : 0} />
            </ReactPlaceholder>
          </div>
        </div>
      </div>
      <div className="cf pt1">
        <div className="w-100 w-50-ns fl">
          <a
            className="link red pb2"
            href={`${OSM_SERVER_URL}/user/${username}/account`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FormattedMessage {...messages.editOSMProfile} />
          </a>
        </div>
        <div className="w-100 w-50-ns fl">
          <a
            className="link red pb2"
            href={`https://osmcha.mapbox.com/?filters={"users":[{"label":"${username}","value":"${username}"}]}`}
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
      <p>
        <FormattedMessage {...messages.interestsLead} />
        <UserInterestsForm />
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
        <Link to={'/learn'} className="link red mr4">
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
