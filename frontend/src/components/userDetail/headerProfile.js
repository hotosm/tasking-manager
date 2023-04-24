import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FormattedMessage, useIntl } from 'react-intl';

import messages from '../user/messages';
import { TwitterIconNoBg, FacebookIcon, LinkedinIcon, ProfilePictureIcon } from '../svgIcons';
import { MappingLevelMessage } from '../mappingLevel';
import { NextMappingLevel } from '../user/topBar';
import { UserOrganisations } from './userTeamsOrgs';
import { SectionMenu } from '../menu';
import OsmLogo from '../../assets/img/osm_logo.png';
import SlackLogo from '../../assets/img/icons/slack.png';
import OsmChaLogo from '../../assets/img/icons/osm-cha.png';
import HdycNeisOneLogo from '../../assets/img/icons/hdyc-neis-one.png';
import { OSM_SERVER_URL, ORG_CODE } from '../../config';

export const SocialMedia = ({ data }) => {
  const intl = useIntl();
  const socialMediaItems = ['twitterId', 'facebookId', 'linkedinId'];

  const getSocialIcon = (field) => {
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
    const urls = {
      twitterId: `https://www.twitter.com/${value}`,
      facebookId: `https://www.facebook.com/${value}`,
      linkedinId: `https://www.linkedin.com/in/${value}`,
      osm: `${OSM_SERVER_URL}/user/${value}`,
      missingmaps: `https://www.missingmaps.org/users/#/${value}`,
      osmcha: `https://osmcha.org/?filters={"users":[{"label":"${value}","value":"${value}"}]}`,
      hdycNeisOne: `https://hdyc.neis-one.org/?${value}`,
    };

    return (
      <a
        className="blue-grey no-underline"
        rel="noopener noreferrer"
        target="_blank"
        href={urls[field]}
      >
        {value}
      </a>
    );
  };

  return (
    <ul className="list pa0 ma0 mt3">
      <li className="dib mr4-ns mr2 cf f7">
        <div className="mr2 h2">
          <img className="h1 v-mid" src={OsmLogo} alt="OpenStreetMap" />{' '}
          {createLink('osm', data.username)}
        </div>
      </li>
      <li className="dib mr4-ns mr2 cf f7" title={intl.formatMessage(messages.osmChaUsername)}>
        <div className="mr2 h2">
          <img className="h1 v-mid" src={OsmChaLogo} alt="OSM Cha Logo" />{' '}
          {createLink('osmcha', data.username)}
        </div>
      </li>
      <li className="dib mr4-ns mr2 cf f7">
        <div className="mr2 h2">
          <img className="h1 v-mid" src={HdycNeisOneLogo} alt="HDYC Neis One Favicon" />{' '}
          {createLink('hdycNeisOne', data.username)}
        </div>
      </li>
      {data.slackId && (
        <li
          className="dib mr4-ns mr2 cf f7"
          title={intl.formatMessage(messages.slackUsername, { org: ORG_CODE })}
        >
          <div className="mr2 h2 blue-grey">
            <img className="h1 v-mid" src={SlackLogo} alt="Slack" /> {data.slackId}
          </div>
        </li>
      )}
      {socialMediaItems.map((i) => {
        if (!data[i]) {
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

export const MyContributionsNav = ({ username, authUser }) => {
  const items = [
    { url: `/contributions`, label: <FormattedMessage {...messages.myStats} /> },
    {
      url: '/contributions/projects/?mappedByMe=1&action=any',
      label: <FormattedMessage {...messages.myProjects} />,
    },
    { url: '/contributions/tasks', label: <FormattedMessage {...messages.myTasks} /> },
    { url: '/contributions/teams', label: <FormattedMessage {...messages.myTeams} /> },
  ];

  return (
    <div className="fl ph5-l ph2">
      <SectionMenu items={items} />
    </div>
  );
};

export const HeaderProfile = ({ userDetails, changesets, selfProfile }) => {
  const authDetails = useSelector((state) => state.auth.userDetails);
  const [user, setUser] = useState({});

  useEffect(() => {
    if (selfProfile && authDetails) {
      setUser(authDetails);
    }
  }, [selfProfile, authDetails, authDetails.username]);

  useEffect(() => {
    if (userDetails && userDetails.id) {
      setUser(userDetails);
    }
  }, [userDetails]);

  return (
    <>
      <div className="w-100 h-100 cf pv4 pl5-l ph2 bg-white blue-dark flex flex-column flex-row-ns items-center">
        <div className="fl dib pr3">
          {user.pictureUrl ? (
            <img
              className="h4 w4 br-100 pa1 ba b--grey-light bw3 red"
              src={user.pictureUrl}
              alt={user.username}
            />
          ) : (
            <ProfilePictureIcon className="red" />
          )}
        </div>
        <div className="w-70-ns w-100 fl dib tc tl-ns">
          <div className="pl2 dib w-50-l fl w-100">
            <p className="barlow-condensed f2 ttu fw5 ma0 mb3" style={{ letterSpacing: '1.25px' }}>
              {user.name || user.username}
            </p>
            <p className="f125 ma0 mb2 fw5">
              <MappingLevelMessage level={user.mappingLevel} />
            </p>
            <NextMappingLevel changesetsCount={changesets} />
            <SocialMedia data={user} />
          </div>
          <div className="pt1 dib fl w-50-l w-100 v-btm">
            <UserOrganisations userId={user.id} />
          </div>
        </div>
      </div>
      {user.username === authDetails.username && <MyContributionsNav username={user.username} />}
    </>
  );
};
