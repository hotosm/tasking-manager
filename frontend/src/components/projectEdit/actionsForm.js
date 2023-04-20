import React, { useState, useContext, useEffect, Suspense } from 'react';
import { useSelector } from 'react-redux';
import Popup from 'reactjs-popup';
import Select from 'react-select';
import { useNavigate } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { Button } from '../button';
import { Alert } from '../alert';
import { DeleteModal } from '../deleteModal';
import { styleClasses, StateContext } from '../../views/projectEdit';
import { fetchLocalJSONAPI, pushToLocalJSONAPI } from '../../network/genericJSONRequest';
import { useFetch } from '../../hooks/UseFetch';
import { useAsync } from '../../hooks/UseAsync';
import ReactPlaceholder from 'react-placeholder';
const CommentInputField = React.lazy(() =>
  import('../comments/commentInput' /* webpackChunkName: "commentInput" */),
);

const ActionStatus = ({ status, action }) => {
  let successMessage = '';
  let errorMessage = '';

  switch (action) {
    case 'MESSAGE_CONTRIBUTORS':
      successMessage = 'messageContributorsSuccess';
      errorMessage = 'messageContributorsError';
      break;
    case 'MAP_ALL_TASKS':
      successMessage = 'mapAllSuccess';
      errorMessage = 'mapAllError';
      break;
    case 'INVALIDATE_ALL_TASKS':
      successMessage = 'invalidateAllSuccess';
      errorMessage = 'invalidateAllError';
      break;
    case 'VALIDATE_ALL_TASKS':
      successMessage = 'validateAllSuccess';
      errorMessage = 'validateAllError';
      break;
    case 'RESET_BAD_IMAGERY':
      successMessage = 'resetBadImagerySuccess';
      errorMessage = 'resetBadImageryError';
      break;
    case 'RESET_ALL':
      successMessage = 'resetAllSuccess';
      errorMessage = 'resetAllError';
      break;
    case 'REVERT_VALIDATED_TASKS':
      successMessage = 'revertVALIDATEDTasksSuccess';
      errorMessage = 'revertTasksError';
      break;
    case 'REVERT_BADIMAGERY_TASKS':
      successMessage = 'revertBADIMAGERYTasksSuccess';
      errorMessage = 'revertTasksError';
      break;
    case 'TRANSFER_PROJECT':
      successMessage = 'transferProjectSuccess';
      errorMessage = 'transferProjectError';
      break;
    case 'DELETE_PROJECT':
      successMessage = 'deleteProjectSuccess';
      errorMessage = 'deleteProjectError';
      break;
    default:
      return null;
  }

  return (
    <>
      {status === 'success' && (
        <Alert type="success">
          <FormattedMessage {...messages[successMessage]} />
        </Alert>
      )}
      {status === 'error' && (
        <Alert type="error">{<FormattedMessage {...messages[errorMessage]} />}</Alert>
      )}
    </>
  );
};

const ResetTasksModal = ({ projectId, close }: Object) => {
  const token = useSelector((state) => state.auth.token);

  const resetTasks = () => {
    return fetchLocalJSONAPI(`projects/${projectId}/tasks/actions/reset-all/`, token, 'POST');
  };
  const resetTasksAsync = useAsync(resetTasks);

  return (
    <div className={styleClasses.modalClass}>
      <h2 className={styleClasses.modalTitleClass}>
        <FormattedMessage {...messages.taskReset} />
      </h2>

      <p className={`${styleClasses.pClass} pb3 `}>
        <FormattedMessage {...messages.taskResetConfirmation} />
      </p>

      <ActionStatus status={resetTasksAsync.status} action="RESET_ALL" />
      <p className="tr">
        <Button className={styleClasses.whiteButtonClass} onClick={close}>
          <FormattedMessage {...messages.cancel} />
        </Button>
        <Button
          className={styleClasses.redButtonClass}
          onClick={() => resetTasksAsync.execute()}
          loading={resetTasksAsync.status === 'pending'}
          disabled={resetTasksAsync.status === 'pending'}
        >
          <FormattedMessage {...messages.taskResetButton} />
        </Button>
      </p>
    </div>
  );
};

const ResetBadImageryModal = ({ projectId, close }: Object) => {
  const token = useSelector((state) => state.auth.token);

  const resetBadImagery = () => {
    return fetchLocalJSONAPI(
      `projects/${projectId}/tasks/actions/reset-all-badimagery/`,
      token,
      'POST',
    );
  };

  const resetBadImageryAsync = useAsync(resetBadImagery);

  return (
    <div className={styleClasses.modalClass}>
      <h2 className={styleClasses.modalTitleClass}>
        <FormattedMessage {...messages.resetBadImagery} />
      </h2>

      <p className={styleClasses.pClass}>
        <FormattedMessage {...messages.resetBadImageryConfirmation} />
      </p>
      <p className={`${styleClasses.pClass} pb2`}>
        <FormattedMessage {...messages.resetBadImageryDescription} />
      </p>

      <ActionStatus status={resetBadImageryAsync.status} action="RESET_BAD_IMAGERY" />
      <p>
        <Button className={styleClasses.whiteButtonClass} onClick={close}>
          <FormattedMessage {...messages.cancel} />
        </Button>
        <Button
          className={styleClasses.redButtonClass}
          onClick={() => resetBadImageryAsync.execute()}
          loading={resetBadImageryAsync.status === 'pending'}
          disabled={resetBadImageryAsync.status === 'pending'}
        >
          <FormattedMessage {...messages.resetBadImageryButton} />
        </Button>
      </p>
    </div>
  );
};

const ValidateAllTasksModal = ({ projectId, close }: Object) => {
  const token = useSelector((state) => state.auth.token);

  const validateAllTasks = () => {
    return fetchLocalJSONAPI(`projects/${projectId}/tasks/actions/validate-all/`, token, 'POST');
  };

  const validateAllTasksAsync = useAsync(validateAllTasks);

  return (
    <div className={styleClasses.modalClass}>
      <h2 className={styleClasses.modalTitleClass}>
        <FormattedMessage {...messages.validateAllTasks} />
      </h2>

      <p className={styleClasses.pClass}>
        <FormattedMessage {...messages.validateAllTasksConfirmation} />
      </p>
      <p className={`${styleClasses.pClass} pb2`}>
        <FormattedMessage {...messages.validateAllTasksDescription} />
      </p>

      <ActionStatus status={validateAllTasksAsync.status} action="VALIDATE_ALL_TASKS" />
      <p>
        <Button className={styleClasses.whiteButtonClass} onClick={close}>
          <FormattedMessage {...messages.cancel} />
        </Button>
        <Button
          className={styleClasses.redButtonClass}
          onClick={() => validateAllTasksAsync.execute()}
          loading={validateAllTasksAsync.status === 'pending'}
          disabled={validateAllTasksAsync.status === 'pending'}
        >
          <FormattedMessage {...messages.validateAllTasks} />
        </Button>
      </p>
    </div>
  );
};

const InvalidateAllTasksModal = ({ projectId, close }: Object) => {
  const token = useSelector((state) => state.auth.token);

  const invalidateAllTasks = () => {
    return fetchLocalJSONAPI(`projects/${projectId}/tasks/actions/invalidate-all/`, token, 'POST');
  };

  const invalidateAllTasksAsync = useAsync(invalidateAllTasks);

  return (
    <div className={styleClasses.modalClass}>
      <h2 className={styleClasses.modalTitleClass}>
        <FormattedMessage {...messages.invalidateAll} />
      </h2>

      <p className={styleClasses.pClass}>
        <FormattedMessage {...messages.invalidateAllConfirmation} />
      </p>
      <p className={`${styleClasses.pClass} pb2`}>
        <FormattedMessage {...messages.invalidateAllDescription} />
      </p>

      <ActionStatus status={invalidateAllTasksAsync.status} action="INVALIDATE_ALL_TASKS" />
      <p>
        <Button className={styleClasses.whiteButtonClass} onClick={close}>
          <FormattedMessage {...messages.cancel} />
        </Button>
        <Button
          className={styleClasses.redButtonClass}
          onClick={() => invalidateAllTasksAsync.execute()}
          loading={invalidateAllTasksAsync.status === 'pending'}
          disabled={invalidateAllTasksAsync.status === 'pending'}
        >
          <FormattedMessage {...messages.invalidateAll} />
        </Button>
      </p>
    </div>
  );
};

const MapAllTasksModal = ({ projectId, close }: Object) => {
  const token = useSelector((state) => state.auth.token);

  const mapAllTasks = () => {
    return fetchLocalJSONAPI(`projects/${projectId}/tasks/actions/map-all/`, token, 'POST');
  };
  const mapAllTasksAsync = useAsync(mapAllTasks);

  return (
    <div className={styleClasses.modalClass}>
      <h2 className={styleClasses.modalTitleClass}>
        <FormattedMessage {...messages.mapAll} />
      </h2>
      <p className={styleClasses.pClass}>
        <FormattedMessage {...messages.mapAllConfirmation} />
      </p>
      <p className={`${styleClasses.pClass} pb2`}>
        <FormattedMessage {...messages.mapAllDescription} />
      </p>
      <ActionStatus status={mapAllTasksAsync.status} action="MAP_ALL_TASKS" />
      <p>
        <Button className={styleClasses.whiteButtonClass} onClick={close}>
          <FormattedMessage {...messages.cancel} />
        </Button>
        <Button
          className={styleClasses.redButtonClass}
          onClick={() => mapAllTasksAsync.execute()}
          loading={mapAllTasksAsync.status === 'pending'}
          disabled={mapAllTasksAsync.status === 'pending'}
        >
          <FormattedMessage {...messages.mapAll} />
        </Button>
      </p>
    </div>
  );
};

const MessageContributorsModal = ({ projectId, close }: Object) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const token = useSelector((state) => state.auth.token);

  const messageAllContributors = () => {
    return pushToLocalJSONAPI(
      `projects/${projectId}/actions/message-contributors/`,
      JSON.stringify({
        subject: subject,
        message: message,
      }),
      token,
      'POST',
    );
  };

  const messageAllContributorsAsync = useAsync(messageAllContributors);

  const handleSubjectChange = (e) => {
    setSubject(e.target.value);
  };

  return (
    <div className={styleClasses.modalClass}>
      <h2 className={styleClasses.modalTitleClass}>
        <FormattedMessage {...messages.messageContributors} />
      </h2>
      <p className={styleClasses.pClass + ' pb3'}>
        <FormattedMessage {...messages.messageContributorsDescription} />
      </p>
      <FormattedMessage {...messages.subjectPlaceholder}>
        {(msg) => {
          return (
            <input
              value={subject}
              onChange={handleSubjectChange}
              name="subject"
              className="db center pa2 w-100 fl mb3"
              type="text"
              placeholder={msg}
            />
          );
        }}
      </FormattedMessage>
      <FormattedMessage {...messages.messagePlaceholder}>
        {(msg) => {
          return (
            <div className="dib w-100 mt-3">
              <Suspense
                fallback={<ReactPlaceholder showLoadingAnimation={true} rows={10} delay={300} />}
              >
                <CommentInputField
                  comment={message}
                  setComment={setMessage}
                  enableHashtagPaste={false}
                  contributors={[]}
                  isShowTabNavs
                />
              </Suspense>
            </div>
          );
        }}
      </FormattedMessage>
      <p className={styleClasses.pClass}>
        <FormattedMessage {...messages.messageContributorsTranslationAlert} />
      </p>
      <ActionStatus status={messageAllContributorsAsync.status} action="MESSAGE_CONTRIBUTORS" />
      <p>
        <Button className={styleClasses.whiteButtonClass} onClick={close}>
          <FormattedMessage {...messages.cancel} />
        </Button>
        <Button
          className={styleClasses.redButtonClass}
          onClick={() => messageAllContributorsAsync.execute()}
          loading={messageAllContributorsAsync.status === 'pending'}
          disabled={messageAllContributorsAsync.status === 'pending'}
        >
          <FormattedMessage {...messages.messageContributors} />
        </Button>
      </p>
    </div>
  );
};

const RevertTasks = ({ projectId, action }) => {
  const token = useSelector((state) => state.auth.token);
  const [user, setUser] = useState(null);
  const [, contributorsLoading, contributors] = useFetch(`projects/${projectId}/contributions/`);

  // To get the count of corresponding action key from contributors
  const actionKey = {
    VALIDATED: 'validated',
    BADIMAGERY: 'badImagery',
  };

  // List only contributors who have made corresponding {action}
  const curatedContributors = contributors.userContributions?.filter(
    (contributor) => contributor[actionKey[action]] > 0,
  );

  const handleUsernameSelection = (e) => {
    setUser(e);
  };

  const revertTasks = () => {
    return pushToLocalJSONAPI(
      `projects/${projectId}/tasks/actions/reset-by-user/?username=${user.username}&action=${action}`,
      null,
      token,
      'POST',
    );
  };

  const revertTasksAsync = useAsync(revertTasks);

  return (
    <div>
      <Select
        classNamePrefix="react-select"
        className="w-40 fl pr2 z-3"
        getOptionLabel={({ username }) => username}
        getOptionValue={({ username }) => username}
        onChange={handleUsernameSelection}
        value={user}
        options={curatedContributors}
        isLoading={contributorsLoading}
      />
      <Button
        onClick={() => revertTasksAsync.execute()}
        loading={revertTasksAsync.status === 'pending'}
        disabled={revertTasksAsync.status === 'pending' || !user}
        className={styleClasses.buttonClass}
      >
        <FormattedMessage {...messages[`revert${action}Tasks`]} />
      </Button>
      <div className="pt1">
        <ActionStatus status={revertTasksAsync.status} action={`REVERT_${action}_TASKS`} />
      </div>
    </div>
  );
};

const TransferProject = ({ projectId, orgId }: Object) => {
  const token = useSelector((state) => state.auth.token);
  const { projectInfo } = useContext(StateContext);
  const [username, setUsername] = useState('');
  const [managers, setManagers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [isFetchingOptions, setIsFetchingOptions] = useState(true);

  useEffect(() => {
    fetchLocalJSONAPI(`organisations/${orgId}/?omitManagerList=false`, token)
      .then((r) => setManagers(r.managers.map((m) => m.username)))
      .then(() => setIsFetchingOptions(false));

    fetchLocalJSONAPI(`users/?pagination=false&role=ADMIN`, token).then((t) =>
      setAdmins(t.users.map((u) => u.username)),
    );
  }, [token, orgId]);

  const optionsExtended = [
    {
      label: projectInfo.organisationName,
      options: managers?.map((manager) => ({
        label: manager,
        value: manager,
      })),
    },
    {
      label: <FormattedMessage {...messages.admins} />,
      options: admins
        ?.filter((admin) => !managers?.includes(admin))
        .map((adminName) => ({
          label: adminName,
          value: adminName,
        })),
    },
  ];

  const handleSelect = (value) => {
    setUsername(value);
  };
  const { username: loggedInUsername, role: loggedInUserRole } = useSelector(
    (state) => state.auth.userDetails,
  );
  const hasAccess =
    managers?.includes(loggedInUsername) ||
    loggedInUserRole === 'ADMIN' ||
    loggedInUsername === projectInfo.author;
  const isDisabled = () => {
    return transferOwnershipAsync.status === 'pending' || !username || !hasAccess;
  };
  const transferOwnership = () => {
    return pushToLocalJSONAPI(
      `projects/${projectId}/actions/transfer-ownership/`,
      JSON.stringify({ username: username }),
      token,
      'POST',
    );
  };
  const transferOwnershipAsync = useAsync(transferOwnership);

  return (
    <div>
      <Select
        classNamePrefix="react-select"
        className="w-40 fl pr2 z-3"
        getOptionLabel={({ label }) => label}
        getOptionValue={({ value }) => value}
        onChange={(e) => handleSelect(e?.value)}
        value={optionsExtended?.find((manager) => manager.value === username)}
        options={optionsExtended}
        isLoading={isFetchingOptions}
      ></Select>
      <Button
        onClick={() => transferOwnershipAsync.execute()}
        loading={transferOwnershipAsync.status === 'pending'}
        disabled={isDisabled()}
        className={styleClasses.buttonClass}
      >
        <FormattedMessage {...messages.transferProject} />
      </Button>
      <div className="pt1">
        <ActionStatus status={transferOwnershipAsync.status} action="TRANSFER_PROJECT" />
      </div>
    </div>
  );
};

const FormattedButtonTrigger = React.forwardRef((props, ref) => (
  <Button {...props}>{props.children}</Button>
));

export const ActionsForm = ({ projectId, projectName, orgId }: Object) => {
  const navigate = useNavigate();

  return (
    <div className="w-100">
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>
          <FormattedMessage {...messages.messageContributors} />
        </label>
        <Popup
          trigger={
            <FormattedButtonTrigger className={styleClasses.actionClass}>
              <FormattedMessage {...messages.messageContributors} />
            </FormattedButtonTrigger>
          }
          modal
          closeOnDocumentClick
          nested
        >
          {(close) => <MessageContributorsModal projectId={projectId} close={close} />}
        </Popup>
      </div>
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>
          <FormattedMessage {...messages.mappingValidationSection} />
        </label>
        <p className={styleClasses.pClass}>
          <FormattedMessage {...messages.mappingValidationSectionDescription} />
        </p>
        <p className={styleClasses.pClass}>
          <span className="fw6">
            <FormattedMessage {...messages.warning} />:{' '}
          </span>
          <FormattedMessage {...messages.canNotUndo} />
        </p>
        <Popup
          trigger={
            <FormattedButtonTrigger className={styleClasses.actionClass}>
              <FormattedMessage {...messages.mapAll} />
            </FormattedButtonTrigger>
          }
          modal
          closeOnDocumentClick
        >
          {(close) => <MapAllTasksModal projectId={projectId} close={close} />}
        </Popup>
        <Popup
          trigger={
            <FormattedButtonTrigger className={styleClasses.actionClass}>
              <FormattedMessage {...messages.invalidateAll} />
            </FormattedButtonTrigger>
          }
          modal
          closeOnDocumentClick
        >
          {(close) => <InvalidateAllTasksModal projectId={projectId} close={close} />}
        </Popup>
        <Popup
          trigger={
            <FormattedButtonTrigger className={styleClasses.actionClass}>
              <FormattedMessage {...messages.validateAllTasks} />
            </FormattedButtonTrigger>
          }
          modal
          closeOnDocumentClick
        >
          {(close) => <ValidateAllTasksModal projectId={projectId} close={close} />}
        </Popup>
      </div>

      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>
          <FormattedMessage {...messages.resetAll} />
        </label>
        <p className={styleClasses.pClass}>
          <FormattedMessage {...messages.resetAllDescription} />
        </p>
        <p className={styleClasses.pClass}>
          <span className="fw6">
            <FormattedMessage {...messages.warning} />:{' '}
          </span>
          <FormattedMessage {...messages.canNotUndo} />
        </p>
        <Popup
          trigger={
            <FormattedButtonTrigger className={styleClasses.actionClass}>
              <FormattedMessage {...messages.resetAllButton} />
            </FormattedButtonTrigger>
          }
          modal
          closeOnDocumentClick
        >
          {(close) => <ResetTasksModal projectId={projectId} close={close} />}
        </Popup>
        <Popup
          trigger={
            <FormattedButtonTrigger className={styleClasses.actionClass}>
              <FormattedMessage {...messages.resetBadImageryButton} />
            </FormattedButtonTrigger>
          }
          modal
          closeOnDocumentClick
        >
          {(close) => <ResetBadImageryModal projectId={projectId} close={close} />}
        </Popup>
      </div>

      {['VALIDATED', 'BADIMAGERY'].map((action) => (
        <div key={action} className={styleClasses.divClass}>
          <label className={styleClasses.labelClass}>
            <FormattedMessage {...messages[`revert${action}TasksTitle`]} />
          </label>
          <p className={styleClasses.pClass}>
            <FormattedMessage {...messages[`revert${action}TasksDescription`]} />
          </p>
          <RevertTasks projectId={projectId} action={action} />
        </div>
      ))}

      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>
          <FormattedMessage {...messages.transferProjectTitle} />
        </label>
        <p className={styleClasses.pClass}>
          <span className="fw6">
            <FormattedMessage {...messages.warning} />:{' '}
          </span>
          <FormattedMessage {...messages.canNotUndo} />
        </p>
        <p className={styleClasses.pClass}>
          <FormattedMessage {...messages.transferProjectAlert} />
        </p>
        <TransferProject projectId={projectId} orgId={orgId} />
      </div>

      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>
          <FormattedMessage {...messages.cloneProject} />
        </label>
        <p className={styleClasses.pClass}>
          <FormattedMessage {...messages.cloneProjectDescription} />
        </p>
        <Button
          onClick={() => navigate(`/manage/projects/new/?cloneFrom=${projectId}`)}
          className={styleClasses.actionClass}
        >
          <FormattedMessage {...messages.cloneProject} />
        </Button>
      </div>

      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>
          <FormattedMessage {...messages.deleteProject} />
        </label>
        <p className={styleClasses.pClass}>
          <FormattedMessage {...messages.deleteProjectAlert} />
        </p>
        <p className={styleClasses.pClass}>
          <span className="fw6">
            <FormattedMessage {...messages.warning} />:{' '}
          </span>
          <FormattedMessage {...messages.canNotUndo} />
        </p>
        <DeleteModal
          id={projectId}
          name={projectName}
          type={'projects'}
          className="pointer bg-red white"
        />
      </div>
    </div>
  );
};
