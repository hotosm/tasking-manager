import React, { useState } from 'react';
import Select from 'react-select';
import ReactPlaceholder from 'react-placeholder';
import { injectIntl } from 'react-intl';

import messages from './messages.js';
import { UserAvatar } from '../user/avatar';
import { CheckCircle } from '../checkCircle';
import { MappedIcon, ValidatedIcon, AsteriskIcon, StarIcon, FullStarIcon } from '../svgIcons';
import ProjectProgressBar from '../projectcard/projectProgressBar';
import { useComputeCompleteness } from '../../hooks/UseProjectCompletenessCalc';
import { OSMChaButton } from '../projectDetail/osmchaButton';
import ReactTooltip from 'react-tooltip';
import { FormattedMessage } from 'react-intl';

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

  const MappingLevelSelect = () => {
    return (
      <Select
        classNamePrefix="react-select"
        isClearable={false}
        options={mappingLevels}
        onChange={(value) => setLevel(value)}
        className="w-30 fr mb3 pointer"
        value={level}
      />
    );
  };

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

  const MappingLevelIcon = ({ mappingLevel }) => {
    let numberofIcons = null;
    switch (mappingLevel) {
      case 'BEGINNER':
        numberofIcons = 1;
        break;
      case 'INTERMEDIATE':
        numberofIcons = 2;
        break;
      case 'ADVANCED':
        numberofIcons = 3;
        break;
      default:
        return null;
    }

    let icons = [];
    for (let i = 0; i < numberofIcons; i++) {
      icons.push(<FullStarIcon className="h1 w1" />);
    }
    const emptyIcons = 3 - numberofIcons;
    for (let i = 0; i < emptyIcons; i++) {
      icons.push(<StarIcon className="h1 w1" />);
    }

    return <div>{icons}</div>;
  };

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
        <MappingLevelSelect />
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
              >
                <FormattedMessage {...messages.registered}>
                  {(msg) => (
                    <div
                      className="w-20 fl dib truncate"
                      data-tip={`${msg} ${user.dateRegistered}`}
                    >
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
                    </div>
                  )}
                </FormattedMessage>
                <ReactTooltip />
                <div className="w-10 fl mt2">
                  <FormattedMessage {...messages[`mappingLevel${user.mappingLevel}`]}>
                    {(msg) => (
                      <span className="blue-grey ttl dib-ns dn" data-tip={msg}>
                        <MappingLevelIcon mappingLevel={user.mappingLevel} />
                      </span>
                    )}
                  </FormattedMessage>
                  <ReactTooltip />
                </div>
                <div
                  className="w-25 fl tr dib pointer pt2 truncate"
                  onClick={() => displayTasks(user.taskIds, 'MAPPED', user.username)}
                >
                  <MappedIcon className="h1 w1 blue-grey mr2" />
                  <span className="mr1 b self-start">{user.mapped}</span>
                  <CheckCircle
                    className={`${checkActiveUserAndStatus('MAPPED', user.username)} white`}
                  />
                </div>
                <div
                  className="w-25 fl tr dib pointer pt2 truncate"
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
