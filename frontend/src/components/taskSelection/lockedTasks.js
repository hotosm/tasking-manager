import React, { useEffect, useState } from 'react';
import { Link } from '@reach/router';
import { fetchLocalJSONAPI, pushToLocalJSONAPI } from '../../network/genericJSONRequest';
import { useSelector } from 'react-redux';
import { navigate } from '@reach/router';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { Button } from '../button';
import { useGetLockedTasks } from '../../hooks/UseLockedTasks';

export function AnotherProjectLock({ projectId, lockedTasksLength, action }: Object) {
  return (
    <>
      <h3 className="barlow-condensed f3 fw6 mv0">
        <FormattedMessage {...messages.anotherLockedTask} />
      </h3>
      <div className="mv4 lh-title">
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
      <Link to={`/projects/${projectId}/${action}/`}>
        <Button className="bg-red white">
          <FormattedMessage {...messages.goToProject} values={{ project: projectId }} />
        </Button>
      </Link>
    </>
  );
}

export function SameProjectLock({ lockedTasks, action }: Object) {
  return (
    <>
      <h3 className="barlow-condensed f3 fw6 mv0">
        <FormattedMessage {...messages.anotherLockedTask} />
      </h3>
      <div className="mv4 lh-title">
        <FormattedMessage
          {...messages[
            lockedTasks.get('tasks').length > 1
              ? 'currentProjectLockTextPlural'
              : 'currentProjectLockTextSingular'
          ]}
          values={{ taskId: <span className="fw6">{lockedTasks.get('tasks')}</span> }}
        />
      </div>
      <Button
        className="bg-red white"
        onClick={() => navigate(`/projects/${lockedTasks.get('project')}/${action}/`)}
      >
        <FormattedMessage
          {...messages[
            lockedTasks.get('tasks').length > 1 ? 'workOnTasksPlural' : 'workOnTasksSingular'
          ]}
          values={{ mapOrValidate: <FormattedMessage {...messages[action]} /> }}
        />
      </Button>
    </>
  );
}

export const LicenseError = ({ id, close, lockTasks }) => {
  const token = useSelector((state) => state.auth.get('token'));
  const [license, setLicense] = useState(null);
  useEffect(() => {
    const fetchLicense = async (id) => {
      const res = await fetchLocalJSONAPI(`licenses/${id}/`);
      setLicense(res);
    };
    fetchLicense(id);
  }, [id]);

  const AcceptLicense = () => {
    pushToLocalJSONAPI(`licenses/${id}/actions/accept-for-me/`, null, token).then(() =>
      lockTasks(),
    );
  };

  return (
    <>
      <h3 className="barlow-condensed f3 fw6 mv0">
        <FormattedMessage {...messages.lockErrorLicense} />
      </h3>
      {license === null ? null : (
        <div className="mt3 lh-title">
          <FormattedMessage {...messages.lockErrorLicenseDescription} />
          <div className="h5 ph2 overflow-scroll">
            <p className="fw6 f5 ttu">{license.name}</p>
            <p className="f6">{license.description}</p>
            <p className="f6">{license.plainText}</p>
          </div>
          <div className="w-100 pt3">
            <Button onClick={() => close()} className="blue-dark bg-white mr2">
              <FormattedMessage {...messages.cancel} />
            </Button>
            <Button onClick={() => AcceptLicense()} className="white bg-red">
              <FormattedMessage {...messages.acceptLicense} />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export function LockError() {
  return (
    <>
      <h3 className="barlow-condensed f3 fw6 mv0">
        <FormattedMessage {...messages.lockError} />
      </h3>
      <div className="mv4 lh-title">
        <FormattedMessage {...messages.lockErrorDescription} />
      </div>
    </>
  );
}

export function JosmError({ close }: Object) {
  return (
    <>
      <h3 className="barlow-condensed f3 fw6 mv0">
        <FormattedMessage {...messages.josmError} />
      </h3>
      <div className="mv4 lh-title">
        <FormattedMessage {...messages.josmErrorDescription} />
      </div>
      <div className="w-100 pt3">
        <Button onClick={() => close()} className="bg-red white mr2">
          <FormattedMessage {...messages.closeModal} />
        </Button>
      </div>
    </>
  );
}

export function LockedTaskModalContent({ project, error, close, lockTasks }: Object) {
  const lockedTasks = useGetLockedTasks();
  const action = lockedTasks.get('status') === 'LOCKED_FOR_VALIDATION' ? 'validate' : 'map';
  const licenseError =
    ['Conflict', 'CONFLICT', 'conflict'].includes(error) && !lockedTasks.get('project');
  const josmError = error === 'JOSM' && !lockedTasks.get('project');
  return (
    <div className="blue-dark bg-white pv2 pv4-ns ph2 ph4-ns">
      {licenseError && <LicenseError id={project.licenseId} close={close} lockTasks={lockTasks} />}
      {josmError && <JosmError close={close} />}

      {/* User has not tasks locked, but other error happened */}
      {!lockedTasks.get('project') && !licenseError && !josmError && <LockError />}
      {/* User has tasks locked on another project */}
      {lockedTasks.get('project') && lockedTasks.get('project') !== project.projectId && (
        <AnotherProjectLock
          projectId={lockedTasks.get('project')}
          action={action}
          lockedTasksLength={lockedTasks.get('tasks').length}
        />
      )}
      {/* User has tasks locked on the current project */}
      {lockedTasks.get('project') === project.projectId && (
        <SameProjectLock action={action} lockedTasks={lockedTasks} />
      )}
    </div>
  );
}
