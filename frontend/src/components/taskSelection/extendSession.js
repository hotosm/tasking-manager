import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import Popup from 'reactjs-popup';

import { Button } from '../button';
import { Alert } from '../alert';
import { pushToLocalJSONAPI } from '../../network/genericJSONRequest';
import messages from './messages';

export function SessionAboutToExpire({
  showSessionExpiringDialog,
  setShowSessionExpiryDialog,
  projectId,
  token,
  tasksIds,
  getTasks,
  expiredTimeoutRef,
}) {
  const [isSessionExtended, setIsSessionExtended] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleTimeExtend = () => {
    setIsError(false);
    pushToLocalJSONAPI(
      `projects/${projectId}/tasks/actions/extend/`,
      JSON.stringify({ taskIds: tasksIds }),
      token,
    )
      .then(() => {
        setIsSessionExtended(true);
        clearTimeout(expiredTimeoutRef.current);
        setTimeout(handleClose, 6969);
        getTasks();
      })
      .catch(() => setIsError(true));
  };

  const handleClose = () => {
    setShowSessionExpiryDialog(false);
    setIsSessionExtended(false);
    setIsError(false);
  };

  return (
    <Popup
      modal
      open={showSessionExpiringDialog}
      closeOnEscape={true}
      closeOnDocumentClick={true}
      onClose={handleClose}
    >
      {(close) => (
        <div className="blue-dark bg-white pv2 pv4-ns ph2 ph4-ns">
          <h3 className="barlow-condensed f3 fw6 mv0">
            <FormattedMessage {...messages.sessionAboutToExpireTitle} />
          </h3>
          <div className="mv4 lh-title">
            <FormattedMessage {...messages.sessionAboutToExpireDescription} />
          </div>
          {isSessionExtended && (
            <Alert type="success">
              <FormattedMessage {...messages.sessionExtended} />
            </Alert>
          )}
          {isError && (
            <Alert type="error">
              <FormattedMessage {...messages.sessionExtensionError} />
            </Alert>
          )}
          <div className={`flex justify-end ${isSessionExtended || isError ? 'mt4' : ''}`}>
            <Button onClick={close}>Close</Button>
            {!isSessionExtended && (
              <Button className="bg-red white ml3" onClick={handleTimeExtend}>
                <FormattedMessage {...messages.extendTime} />
              </Button>
            )}
          </div>
        </div>
      )}
    </Popup>
  );
}

export function SessionExpired({
  showSessionExpiredDialog,
  setShowSessionExpiredDialog,
  projectId,
  token,
  tasksIds,
  action,
  getTasks,
}) {
  const [isTaskRelocked, setIsTaskRelocked] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleTimeExtend = () => {
    setIsError(false);
    const url =
      action === 'MAPPING'
        ? `projects/${projectId}/tasks/actions/lock-for-mapping/${tasksIds[0]}/`
        : `projects/${projectId}/tasks/actions/lock-for-validation/`;

    pushToLocalJSONAPI(url, JSON.stringify({ taskIds: tasksIds }), token)
      .then(() => {
        setIsTaskRelocked(true);
        setTimeout(handleClose, 6969);
        getTasks();
      })
      .catch(() => setIsError(true));
  };

  const handleClose = () => {
    setShowSessionExpiredDialog(false);
    setIsTaskRelocked(false);
    setIsError(false);
  };

  return (
    <Popup
      modal
      open={showSessionExpiredDialog}
      closeOnEscape={true}
      closeOnDocumentClick={true}
      onClose={handleClose}
    >
      {(close) => (
        <div className="blue-dark bg-white pv2 pv4-ns ph2 ph4-ns">
          <h3 className="barlow-condensed f3 fw6 mv0">
            <FormattedMessage {...messages.sessionExpiredTitle} />
          </h3>
          <div className="mv4 lh-title">
            <FormattedMessage
              {...messages.sessionExpiredDescription}
              values={{ count: tasksIds.length }}
            />
          </div>
          {isTaskRelocked && (
            <Alert type="success">
              <FormattedMessage {...messages.taskRelocked} values={{ count: tasksIds.length }} />
            </Alert>
          )}
          {isError && (
            <Alert type="error">
              <FormattedMessage {...messages.taskRelockError} values={{ count: tasksIds.length }} />
            </Alert>
          )}
          <div className={`flex justify-end ${isTaskRelocked || isError ? 'mt4' : ''}`}>
            <Button onClick={close}>Close</Button>
            {!isTaskRelocked && (
              <Button className="bg-red white ml3" onClick={handleTimeExtend}>
                <FormattedMessage {...messages.relockTask} values={{ count: tasksIds.length }} />
              </Button>
            )}
          </div>
        </div>
      )}
    </Popup>
  );
}
