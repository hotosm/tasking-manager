import React from 'react';
import { useSelector } from 'react-redux';
import { navigate } from '@reach/router';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { Button } from '../button';

export function AnotherProjectLock({ projectId, lockedTasksLength, action }: Object) {
  return (
    <>
      <h3 className="barlow-condensed f3 fw6 mv0">
        <FormattedMessage {...messages.anotherProjectLock} />
      </h3>
      <div className="mv4">
        <FormattedMessage
          {...messages[
            lockedTasksLength > 1
              ? 'anotherProjectLockTextPlural'
              : 'anotherProjectLockTextSingular'
          ]}
          values={{
            project: <span className="fw6">{projectId}</span>,
            n: <span className="fw6">{lockedTasksLength}</span>,
            action: (
              <span className="ttl">
                <FormattedMessage {...messages[action]} />
              </span>
            ),
          }}
        />
      </div>
      <Button className="bg-red white" onClick={() => navigate(`/projects/${projectId}/${action}`)}>
        <FormattedMessage {...messages.goToProject} values={{ project: projectId }} />
      </Button>
    </>
  );
}

export function LockedTaskModalContent({ project }: Object) {
  const lockedTasks = useSelector(state => state.lockedTasks);
  const action = lockedTasks.get('status') === 'LOCKED_FOR_VALIDATION' ? 'validate' : 'map';

  return (
    <div className="blue-dark pv2 pv4-ns ph2 ph4-ns">
      {/* User has tasks locked on another project */}
      {lockedTasks.get('project') !== project && (
        <AnotherProjectLock
          projectId={lockedTasks.get('project')}
          action={action}
          lockedTasksLength={lockedTasks.get('tasks').length}
        />
      )}
      {/* User has tasks locked on the current project */}
      {lockedTasks.get('project') === project && (
        <>
          <h3 className="barlow-condensed f3 fw6 mv0">
            <FormattedMessage {...messages.currentProjectLock} />
          </h3>
          <div className="mv4">
            <FormattedMessage
              {...messages[
                lockedTasks.get('tasks').length > 1
                  ? 'currentProjectLockTextPlural'
                  : 'currentProjectLockTextSingular'
              ]}
              values={{
                project: <span className="fw6">{lockedTasks.get('project')}</span>,
                n: <span className="fw6">{lockedTasks.get('tasks').length}</span>,
                action: (
                  <span className="ttl">
                    <FormattedMessage {...messages[action]} />
                  </span>
                ),
              }}
            />
          </div>
          <Button
            className="bg-red white"
            onClick={() => navigate(`/projects/${lockedTasks.get('project')}/${action}`)}
          >
            <FormattedMessage
              {...messages[
                lockedTasks.get('tasks').length > 1 ? 'workOnTasksPlural' : 'workOnTasksSingular'
              ]}
              values={{ mapOrValidate: <FormattedMessage {...messages[action]} /> }}
            />
          </Button>
        </>
      )}
    </div>
  );
}
