import React, { useState } from 'react';
import Select from 'react-select';
import ReactPlaceholder from 'react-placeholder';
import { injectIntl } from 'react-intl';

import messages from './messages.js';
import { UserAvatar } from '../user/avatar';
import { CheckCircle } from '../checkCircle';
import ProjectProgressBar from '../projectcard/projectProgressBar';
import { useComputeCompleteness } from '../../hooks/UseProjectCompletenessCalc';
import { OSMChaButton } from '../projectDetail/osmchaButton';

const Contributions = (props) => {
  const mappingLevels = [
    { value: 'ALL', label: props.intl.formatMessage(messages.mappingLevelALL) },
    { value: 'ADVANCED', label: props.intl.formatMessage(messages.mappingLevelADVANCED) },
    { value: 'INTERMEDIATE', label: props.intl.formatMessage(messages.mappingLevelINTERMEDIATE) },
    { value: 'BEGINNER', label: props.intl.formatMessage(messages.mappingLevelBEGINNER) },
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
  if (level.value !== 'ALL') {
    contributionsArray = contributionsArray.filter((u) => u.mappingLevel === level.value);
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
                <div className="w-30 fl dib truncate">
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
                  <span className="blue-grey ttl dib-ns dn">
                    ({props.intl.formatMessage(messages[`mappingLevel${user.mappingLevel}`])})
                  </span>
                </div>
                <div
                  className="w-25 fl tr dib pointer pt2 truncate"
                  onClick={() => displayTasks(user.taskIds, 'MAPPED', user.username)}
                >
                  <span className="mr1 b self-start">{user.mapped}</span>
                  <span className="ttl mr2">{props.intl.formatMessage(messages.mapped)}</span>
                  <CheckCircle
                    className={`${checkActiveUserAndStatus('MAPPED', user.username)} white`}
                  />
                </div>
                <div
                  className="w-25 fl tr dib pointer pt2 truncate"
                  onClick={() => displayTasks(user.taskIds, 'VALIDATED', user.username)}
                >
                  <span className="mr1 b">{user.validated}</span>
                  <span className="ttl mr2">{props.intl.formatMessage(messages.validated)}</span>
                  <CheckCircle
                    className={`${checkActiveUserAndStatus('VALIDATED', user.username)} white`}
                  />
                </div>
                <div
                  className="w-20 fl tr dib pointer pt2 truncate"
                  onClick={() => displayTasks(user.taskIds, 'ALL', user.username)}
                >
                  <span className="mr1 b">{user.total}</span>
                  <span className="ttl mr2">{props.intl.formatMessage(messages.total)}</span>
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
