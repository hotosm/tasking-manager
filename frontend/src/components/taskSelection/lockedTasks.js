import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  const navigate = useNavigate();
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

  const acceptLicense = () => {
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
            <Button onClick={() => acceptLicense()} className="white bg-red">
              <FormattedMessage {...messages.acceptLicense} />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export function LockError({ error, close, tasks, selectedTasks, setSelectedTasks, lockTasks }) {
  const shouldShowDeselectButton = error === 'CannotValidateMappedTask' && selectedTasks.length > 1;

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
      <LockErrorButtons
        close={close}
        shouldShowDeselectButton={shouldShowDeselectButton}
        tasks={tasks}
        selectedTasks={selectedTasks}
        setSelectedTasks={setSelectedTasks}
        lockTasks={lockTasks}
      />
    </>
  );
}

function LockErrorButtons({
  close,
  shouldShowDeselectButton,
  lockTasks,
  tasks,
  selectedTasks,
  setSelectedTasks,
}) {
  const user = useSelector((state) => state.auth.userDetails);
  const [hasTasksChanged, setHasTasksChanged] = useState(false);

  const handleDeselectAndValidate = () => {
    const userMappedTaskIds = tasks.features
      .filter((feature) => feature.properties.mappedBy === user.id)
      .map((feature) => feature.properties.taskId);

    const remainingSelectedTasks = selectedTasks.filter(
      (selectedTask) => !userMappedTaskIds.includes(selectedTask),
    );
    setSelectedTasks(remainingSelectedTasks);
    // Set the flag to indicate that tasks have changed.
    // Note: The introduction of useEffect pattern might benefit
    // from future optimization.
    setHasTasksChanged(true);
  };

  useEffect(() => {
    if (hasTasksChanged) {
      lockTasks();
      setHasTasksChanged(false);
    }
  }, [hasTasksChanged, lockTasks]);

  return (
    <div className="w-100 pt3 flex justify-end">
      <Button
        onClick={close}
        className={`mr2 ${shouldShowDeselectButton ? 'bg-transparent black' : 'bg-red white'}`}
      >
        <FormattedMessage {...messages.closeModal} />
      </Button>
      {shouldShowDeselectButton && (
        <Button onClick={handleDeselectAndValidate} className="bg-red white mr2">
          <FormattedMessage {...messages.deselectAndValidate} />
        </Button>
      )}
    </div>
  );
}

export function LockedTaskModalContent({
  project,
  error,
  close,
  lockTasks,
  tasks,
  selectedTasks,
  setSelectedTasks,
}: Object) {
  const lockedTasks = useGetLockedTasks();
  const action = lockedTasks.status === 'LOCKED_FOR_VALIDATION' ? 'validate' : 'map';
  const licenseError = error === 'UserLicenseError' && !lockedTasks.project;

  return (
    <div className="blue-dark bg-white pv2 pv4-ns ph2 ph4-ns">
      {licenseError && <LicenseError id={project.licenseId} close={close} lockTasks={lockTasks} />}
      {/* Other error happened */}
      {error === 'JOSM' && <LockError error={error} close={close} />}
      {!lockedTasks.project && !licenseError && error !== 'JOSM' && (
        <LockError
          error={error}
          close={close}
          lockTasks={lockTasks}
          tasks={tasks}
          selectedTasks={selectedTasks}
          setSelectedTasks={setSelectedTasks}
        />
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
