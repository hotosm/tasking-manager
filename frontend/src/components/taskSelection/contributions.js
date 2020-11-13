import React, { useState } from 'react';
import { Link } from '@reach/router';
import Select from 'react-select';
import ReactPlaceholder from 'react-placeholder';
import { FormattedMessage, useIntl } from 'react-intl';

import messages from './messages.js';
import { UserAvatar } from '../user/avatar';
import { CheckCircle } from '../checkCircle';
import { CustomButton } from '../button';
import {
  MappedIcon,
  ValidatedIcon,
  AsteriskIcon,
  HalfStarIcon,
  FullStarIcon,
  ChartLineIcon,
} from '../svgIcons';
import ProjectProgressBar from '../projectCard/projectProgressBar';
import { useComputeCompleteness } from '../../hooks/UseProjectCompletenessCalc';
import { getPastMonths } from '../../utils/date';
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
  const intl = useIntl();
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
              <span title={`${msg} ${intl.formatDate(user.dateRegistered)}`}>
                <UserAvatar
                  picture={user.pictureUrl}
                  username={user.username}
                  colorClasses="white bg-blue-grey"
                />
                <Link className="blue-dark mr2 link" to={`/users/${user.username}`}>
                  {user.username}
                </Link>
              </span>
            </>
          )}
        </FormattedMessage>
        <MappingLevelIcon mappingLevel={user.mappingLevel} />
      </div>

      <div className="w-20 fl tr dib truncate">
        <div
          className="dib pt2 pointer"
          onClick={() => displayTasks(user.mappedTasks, 'MAPPED', user.username)}
          title={intl.formatMessage(messages.mappedByUser, { username: user.username })}
        >
          <MappedIcon className="h1 w1 blue-grey mr2" />
          <span className="mr1 b self-start">{user.mapped}</span>
          <CheckCircle className={`${checkActiveUserAndStatus('MAPPED', user.username)} white`} />
        </div>
      </div>
      <div className="w-20 fl tr dib truncate">
        <div
          className="dib pt2 pointer"
          onClick={() => displayTasks(user.validatedTasks, 'VALIDATED', user.username)}
          title={intl.formatMessage(messages.validatedByUser, { username: user.username })}
        >
          <ValidatedIcon className="h1 w1 blue-grey mr2" />
          <span className="mr1 b">{user.validated}</span>
          <CheckCircle
            className={`${checkActiveUserAndStatus('VALIDATED', user.username)} white`}
          />
        </div>
      </div>
      <div className="w-20 fl tr dib truncate">
        <div
          className="dib pt2 pointer"
          onClick={() =>
            displayTasks([...user.mappedTasks, ...user.validatedTasks], 'ALL', user.username)
          }
          title={intl.formatMessage(messages.allUserTasks, { username: user.username })}
        >
          <AsteriskIcon className="h1 w1 blue-grey mr2" />
          <span className="mr1 b">{user.total}</span>
          <CheckCircle className={`${checkActiveUserAndStatus('ALL', user.username)} white`} />
        </div>
      </div>
    </div>
  );
}

const Contributions = ({ project, tasks, contribsData, activeUser, activeStatus, selectTask }) => {
  const intl = useIntl();
  const mappingLevels = [
    { value: 'ALL', label: intl.formatMessage(messages.mappingLevelALL) },
    { value: 'ADVANCED', label: intl.formatMessage(messages.mappingLevelADVANCED) },
    { value: 'INTERMEDIATE', label: intl.formatMessage(messages.mappingLevelINTERMEDIATE) },
    { value: 'BEGINNER', label: intl.formatMessage(messages.mappingLevelBEGINNER) },
    { value: 'NEWUSER', label: intl.formatMessage(messages.mappingLevelNEWUSER) },
  ];
  const [level, setLevel] = useState(mappingLevels[0]);
  const { percentMapped, percentValidated, percentBadImagery } = useComputeCompleteness(tasks);

  let contributionsArray = contribsData.userContributions || [];
  if (level.value !== 'ALL' && level.value !== 'NEWUSER') {
    contributionsArray = contributionsArray.filter((u) => u.mappingLevel === level.value);
  }

  const displayTasks = (taskIds, status, user) => {
    if (activeStatus === status && user === activeUser) {
      selectTask([]);
      return;
    }

    selectTask(taskIds, status, user);
  };

  if (level.value === 'NEWUSER') {
    const monthFiltered = getPastMonths(1);
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
        <Link to={`/projects/${project.projectId}/stats/`}>
          <CustomButton className="bg-white blue-light bn">
            <FormattedMessage {...messages.statistics} />
            <ChartLineIcon className="pl1 pb1 h1 v-mid" />
          </CustomButton>
        </Link>
        <span className="blue-light f4 fw7 ph1">&#183;</span>
        <OSMChaButton project={project} className="bg-white blue-light bn mv2" compact={true} />
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
                activeUser={activeUser}
                activeStatus={activeStatus}
                displayTasks={displayTasks}
              />
            );
          })}
        </ReactPlaceholder>
      </div>
    </div>
  );
};

export default Contributions;
