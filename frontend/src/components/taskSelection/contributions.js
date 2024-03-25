import { useState } from 'react';
import { Link } from 'react-router-dom';
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
import { useFilterContributors } from '../../hooks/UseFilterContributors';
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
      className={`w-100 cf pv3 ph3-ns ph1 bw1 mb2 ${
        activeUser === user.username ? 'ba b--blue-dark' : 'shadow-2'
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
          role="button"
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
          role="button"
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
          role="button"
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
  const defaultUserFilter = {
    label: intl.formatMessage(messages.userFilterDefaultLabel),
    value: null,
  };
  const [level, setLevel] = useState(mappingLevels[0]);
  const [userFilter, setUserFilter] = useState(defaultUserFilter);
  const { percentMapped, percentValidated, percentBadImagery } = useComputeCompleteness(tasks);

  const contributors = useFilterContributors(
    contribsData || [],
    level && level.value,
    userFilter && userFilter.value,
  );

  const displayTasks = (taskIds, status, user) => {
    if (activeStatus === status && user === activeUser) {
      selectTask([]);
      return;
    }
    selectTask(taskIds, status, user);
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
          onChange={(value) => {
            setLevel(value);
            setUserFilter(defaultUserFilter); // reset userFilter
          }}
          className="w-25 fr mb3 pointer"
          value={level}
        />

        {/* this select searches username in given level */}
        <Select
          classNamePrefix="react-select"
          isClearable={true}
          options={contributors.map((user) => ({ value: user.username, label: user.username }))}
          onChange={(value) => setUserFilter(value)}
          className="w-25 fr pr3 mb3 pointer"
          value={userFilter}
        />
      </div>
      <div className="w-100 fl cf">
        <ReactPlaceholder
          showLoadingAnimation={true}
          rows={6}
          delay={50}
          ready={contributors !== undefined}
        >
          {contributors.map((user, k) => (
            <Contributor
              user={user}
              activeUser={activeUser}
              activeStatus={activeStatus}
              displayTasks={displayTasks}
              key={k}
            />
          ))}
        </ReactPlaceholder>
      </div>
    </div>
  );
};

export default Contributions;
