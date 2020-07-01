import React, { useState } from 'react';
import Select from 'react-select';
import ReactPlaceholder from 'react-placeholder';
import { FormattedMessage, injectIntl, useIntl } from 'react-intl';

import messages from './messages.js';
import { UserAvatar } from '../user/avatar';
import { CheckCircle } from '../checkCircle';
import { MappedIcon, ValidatedIcon, AsteriskIcon, HalfStarIcon, FullStarIcon } from '../svgIcons';
import ProjectProgressBar from '../projectCard/projectProgressBar';
import { useComputeCompleteness } from '../../hooks/UseProjectCompletenessCalc';
import { OSMChaButton } from '../projectDetail/osmchaButton';

export const MappingLevelIcon = ({ mappingLevel }) => {
  if (['ADVANCED', 'INTERMEDIATE'].includes(mappingLevel)) {
    return (
      <>
        <FormattedMessage {...messages[`mappingLevel${mappingLevel}`]}>
          {(msg) => (
            <span className="blue-grey ttl" title={msg}>
              {mappingLevel === 'ADVANCED' ? (
                <FullStarIcon className="h1 w1 v-mid pb1" />
              ) : (
                <HalfStarIcon className="h1 w1 v-mid pb1" />
              )}
            </span>
          )}
        </FormattedMessage>
      </>
    );
  }
  return null;
};

function Contributor({ user, activeUser, activeStatus, displayTasks }: Object) {
  const { formatDate } = useIntl();
  const checkActiveUserAndStatus = (status, username) =>
    activeStatus === status && activeUser === username ? 'bg-blue-dark' : 'bg-grey-light';

  return (
    <div
      className={`w-100 cf pv3 ph3-ns ph1 ba bw1 mb2 ${
        activeUser === user.username ? 'b--blue-dark' : 'b--tan'
      }`}
    >
      <div className="w-40 fl dib truncate">
        <FormattedMessage {...messages.registered}>
          {(msg) => (
            <>
              <span title={`${msg} ${formatDate(user.dateRegistered)}`}>
                <UserAvatar
                  picture={user.pictureUrl}
                  username={user.username}
                  colorClasses="white bg-blue-grey"
                />
                <a
                  className="blue-dark mr2 link"
                  rel="noopener noreferrer"
                  target="_blank"
                  href={`/users/${user.username}`}
                >
                  {user.username}
                </a>
              </span>
            </>
          )}
        </FormattedMessage>
        <MappingLevelIcon mappingLevel={user.mappingLevel} />
      </div>

      <div
        className="w-20 fl tr dib pointer pt2 truncate"
        onClick={() => displayTasks(user.mappedTasks, 'MAPPED', user.username)}
      >
        <MappedIcon className="h1 w1 blue-grey mr2" />
        <span className="mr1 b self-start">{user.mapped}</span>
        <CheckCircle className={`${checkActiveUserAndStatus('MAPPED', user.username)} white`} />
      </div>
      <div
        className="w-20 fl tr dib pointer pt2 truncate"
        onClick={() => displayTasks(user.validatedTasks, 'VALIDATED', user.username)}
      >
        <ValidatedIcon className="h1 w1 blue-grey mr2" />
        <span className="mr1 b">{user.validated}</span>
        <CheckCircle className={`${checkActiveUserAndStatus('VALIDATED', user.username)} white`} />
      </div>
      <div
        className="w-20 fl tr dib pointer pt2 truncate"
        onClick={() =>
          displayTasks([...user.mappedTasks, ...user.validatedTasks], 'ALL', user.username)
        }
      >
        <AsteriskIcon className="h1 w1 blue-grey mr2" />
        <span className="mr1 b">{user.total}</span>
        <CheckCircle className={`${checkActiveUserAndStatus('ALL', user.username)} white`} />
      </div>
    </div>
  );
}

const Contributions = (props) => {
  const mappingLevels = [
    { value: 'ALL', label: props.intl.formatMessage(messages.mappingLevelALL) },
    { value: 'ADVANCED', label: props.intl.formatMessage(messages.mappingLevelADVANCED) },
    { value: 'INTERMEDIATE', label: props.intl.formatMessage(messages.mappingLevelINTERMEDIATE) },
    { value: 'BEGINNER', label: props.intl.formatMessage(messages.mappingLevelBEGINNER) },
    { value: 'NEWUSER', label: props.intl.formatMessage(messages.mappingLevelNEWUSER) },
  ];
  const [level, setLevel] = useState(mappingLevels[0]);
  const { percentMapped, percentValidated, percentBadImagery } = useComputeCompleteness(
    props.tasks,
  );

  let contributionsArray = props.contribsData.userContributions || [];
  if (level.value !== 'ALL' && level.value !== 'NEWUSER') {
    contributionsArray = contributionsArray.filter((u) => u.mappingLevel === level.value);
  }

  const displayTasks = (taskIds, status, user) => {
    if (props.activeStatus === status && user === props.activeUser) {
      props.selectTask([]);
      return;
    }

    props.selectTask(taskIds, status, user);
  };

  if (level.value === 'NEWUSER') {
    const monthFiltered = new Date();
    monthFiltered.setMonth(monthFiltered.getMonth() - 1);
    contributionsArray = contributionsArray
      .map((u) => {
        return { ...u, dateObj: new Date(u.dateRegistered) };
      })
      .filter((u) => u.dateObj > monthFiltered);
  }

  return (
    <div className="w-100 f5 pr4-l pr2 cf blue-dark bg-white">
      <div className="w-100 fr cf">
        <ProjectProgressBar
          percentMapped={percentMapped}
          percentValidated={percentValidated}
          percentBadImagery={percentBadImagery}
          className="pt1 pb3"
        />
        <OSMChaButton project={props.project} className="bg-white blue-light bn mv2" />
        <Select
          classNamePrefix="react-select"
          isClearable={false}
          options={mappingLevels}
          onChange={(value) => setLevel(value)}
          className="w-30 fr mb3 pointer"
          value={level}
        />
      </div>
      <div className="w-100 fl cf">
        <ReactPlaceholder
          showLoadingAnimation={true}
          rows={6}
          delay={50}
          ready={contributionsArray !== undefined}
        >
          {contributionsArray.map((user) => {
            return (
              <Contributor
                user={user}
                activeUser={props.activeUser}
                activeStatus={props.activeStatus}
                displayTasks={displayTasks}
              />
            );
          })}
        </ReactPlaceholder>
      </div>
    </div>
  );
};

export default injectIntl(Contributions);
