import React, { useEffect, useState } from 'react';
import { Link, navigate, useLocation } from '@reach/router';
import { fetchLocalJSONAPI, pushToLocalJSONAPI } from '../../network/genericJSONRequest';
import { useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { Button } from '../button';
import { useGetLockedTasks } from '../../hooks/UseLockedTasks';

export function AnotherProjectLock({ projectId, lockedTasksLength, action }: Object) {
  const location = useLocation();

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
      <Link to={`/projects/${projectId}/${action}/`} state={{ directedFrom: location.pathname }}>
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
            lockedTasks.tasks.length > 1
              ? 'currentProjectLockTextPlural'
              : 'currentProjectLockTextSingular'
          ]}
          values={{ taskId: <span className="fw6">{lockedTasks.tasks}</span> }}
        />
      </div>
      <Button
        className="bg-red white"
        onClick={() => navigate(`/projects/${lockedTasks.project}/${action}/`)}
      >
        <FormattedMessage
          {...messages[lockedTasks.tasks.length > 1 ? 'workOnTasksPlural' : 'workOnTasksSingular']}
          values={{ mapOrValidate: <FormattedMessage {...messages[action]} /> }}
        />
      </Button>
    </>
  );
}

export const LicenseError = ({ id, close, lockTasks }) => {
  const token = useSelector((state) => state.auth.token);
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

export function LockError({ error, close }) {
  return (
    <>
      <h3 className="barlow-condensed f3 fw6 mv0">
        {messages[`${error}Error`] ? (
          <FormattedMessage {...messages[`${error}Error`]} />
        ) : (
          <FormattedMessage {...messages.lockError} />
        )}
      </h3>
      <div className="mv4 lh-title">
        {messages[`${error}ErrorDescription`] ? (
          <FormattedMessage {...messages[`${error}ErrorDescription`]} />
        ) : (
          <FormattedMessage {...messages.lockErrorDescription} />
        )}
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
  const action = lockedTasks.status === 'LOCKED_FOR_VALIDATION' ? 'validate' : 'map';
  const licenseError = error === 'UserLicenseError' && !lockedTasks.project;

  return (
    <div className="blue-dark bg-white pv2 pv4-ns ph2 ph4-ns">
      {licenseError && <LicenseError id={project.licenseId} close={close} lockTasks={lockTasks} />}
      {/* Other error happened */}
      {error === 'JOSM' && <LockError error={error} close={close} />}
      {!lockedTasks.project && !licenseError && error !== 'JOSM' && (
        <LockError error={error} close={close} />
      )}
      {/* User has tasks locked on another project */}
      {lockedTasks.project && lockedTasks.project !== project.projectId && error !== 'JOSM' && (
        <AnotherProjectLock
          projectId={lockedTasks.project}
          action={action}
          lockedTasksLength={lockedTasks.tasks.length}
        />
      )}
      {/* User has tasks locked on the current project */}
      {lockedTasks.project === project.projectId && error !== 'JOSM' && (
        <SameProjectLock action={action} lockedTasks={lockedTasks} />
      )}
    </div>
  );
}
