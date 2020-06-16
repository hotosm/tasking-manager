import React, { useState } from 'react';
import Select from 'react-select';
import ReactPlaceholder from 'react-placeholder';
import { FormattedMessage, injectIntl, useIntl } from 'react-intl';

import messages from './messages.js';
import { UserAvatar } from '../user/avatar';
import { CheckCircle } from '../checkCircle';
import { MappedIcon, ValidatedIcon, AsteriskIcon, HalfStarIcon, FullStarIcon } from '../svgIcons';
import ProjectProgressBar from '../projectcard/projectProgressBar';
import { useComputeCompleteness } from '../../hooks/UseProjectCompletenessCalc';
import { OSMChaButton } from '../projectDetail/osmchaButton';
import ReactTooltip from 'react-tooltip';

export const MappingLevelIcon = ({ mappingLevel }) => {
  if (['ADVANCED', 'INTERMEDIATE'].includes(mappingLevel)) {
    return (
      <>
        <FormattedMessage {...messages[`mappingLevel${mappingLevel}`]}>
          {(msg) => (
            <span className="blue-grey ttl" data-tip={msg}>
              {mappingLevel === 'ADVANCED' ? (
                <FullStarIcon className="h1 w1 v-mid pb1" />
              ) : (
                <HalfStarIcon className="h1 w1 v-mid pb1" />
              )}
            </span>
          )}
        </FormattedMessage>
        <ReactTooltip />
      </>
    );
  }
  return null;
};

const Contributions = (props) => {
  const { formatDate } = useIntl();
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

  const checkActiveUserAndStatus = (status, username) =>
    props.activeStatus === status && props.activeUser === username
      ? 'bg-blue-dark'
      : 'bg-grey-light';

  const displayTasks = (taskIds, status, user) => {
    if (props.activeStatus === status && user === props.activeUser) {
      props.selectTask([]);
    } else {
      let filteredTasksByStatus = props.tasks.features;
      if (status === 'MAPPED') {
        filteredTasksByStatus = filteredTasksByStatus.filter(
          (task) => task.properties.taskStatus === 'MAPPED',
        );
      }
      if (status === 'VALIDATED') {
        filteredTasksByStatus = filteredTasksByStatus.filter(
          (task) => task.properties.taskStatus === 'VALIDATED',
        );
      }
      const ids = filteredTasksByStatus
        .filter((t) => taskIds.includes(t.properties.taskId))
        .map((f) => f.properties.taskId);
      props.selectTask(ids, status, user);
    }
  };

  let contributionsArray = props.contribsData.userContributions || [];
  if (level.value !== 'ALL' && level.value !== 'NEWUSER') {
    contributionsArray = contributionsArray.filter((u) => u.mappingLevel === level.value);
  }

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
              <div
                className={`w-100 cf pv3 ph3-ns ph1 ba bw1 mb2 ${
                  props.activeUser === user.username ? 'b--blue-dark' : 'b--tan'
                }`}
                key={user.username}
              >
                <div className="w-40 fl dib truncate">
                  <FormattedMessage {...messages.registered}>
                    {(msg) => (
                      <>
                        <span data-tip={`${msg} ${formatDate(user.dateRegistered)}`}>
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
                        <ReactTooltip />
                      </>
                    )}
                  </FormattedMessage>
                  <MappingLevelIcon mappingLevel={user.mappingLevel} />
                </div>

                <div
                  className="w-20 fl tr dib pointer pt2 truncate"
                  onClick={() => displayTasks(user.taskIds, 'MAPPED', user.username)}
                >
                  <MappedIcon className="h1 w1 blue-grey mr2" />
                  <span className="mr1 b self-start">{user.mapped}</span>
                  <CheckCircle
                    className={`${checkActiveUserAndStatus('MAPPED', user.username)} white`}
                  />
                </div>
                <div
                  className="w-20 fl tr dib pointer pt2 truncate"
                  onClick={() => displayTasks(user.taskIds, 'VALIDATED', user.username)}
                >
                  <ValidatedIcon className="h1 w1 blue-grey mr2" />
                  <span className="mr1 b">{user.validated}</span>
                  <CheckCircle
                    className={`${checkActiveUserAndStatus('VALIDATED', user.username)} white`}
                  />
                </div>
                <div
                  className="w-20 fl tr dib pointer pt2 truncate"
                  onClick={() => displayTasks(user.taskIds, 'ALL', user.username)}
                >
                  <AsteriskIcon className="h1 w1 blue-grey mr2" />
                  <span className="mr1 b">{user.total}</span>
                  <CheckCircle
                    className={`${checkActiveUserAndStatus('ALL', user.username)} white`}
                  />
                </div>
              </div>
            );
          })}
        </ReactPlaceholder>
      </div>
    </div>
  );
};

export default injectIntl(Contributions);
