import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import Popup from 'reactjs-popup';
import { navigate } from '@reach/router';

import { Button } from '../button';
import { DeleteModal } from '../deleteModal';
import { styleClasses } from '../../views/projectEdit';
import { fetchLocalJSONAPI, pushToLocalJSONAPI } from '../../network/genericJSONRequest';

const checkError = (error, modal) => {
  let successMessage = '';
  let errorMessage = '';

  switch (modal) {
    case 'MESSAGE_CONTRIBUTORS':
      successMessage = 'Contributors were messaged successfully.';
      errorMessage = 'Failed to message all contributors for an unknown reason.';
      break;
    case 'MAP_ALL_TASKS':
      successMessage = 'The tasks were mapped successfully.';
      errorMessage = 'Mapping all the tasks failed for an unknown reason.';
      break;
    case 'INVALIDATE_ALL_TASKS':
      successMessage = 'The tasks were invalidated successfully.';
      errorMessage = 'Invalidating all the tasks failed for an unknown reason.';
      break;
    case 'VALIDATE_ALL_TASKS':
      successMessage = 'The tasks were validated successfully.';
      errorMessage = 'Validating all the tasks failed for an unknown reason.';
      break;
    case 'RESET_BAD_IMAGERY':
      successMessage = 'The tasks were reset successfully.';
      errorMessage = 'Resetting all the bad imagery tasks failed for an unknown reason.';
      break;
    case 'RESET_ALL':
      successMessage = 'The tasks were reset successfully.';
      errorMessage = 'Resetting all the tasks failed for an unknown reason.';
      break;
    case 'TRANSFER_PROJECT':
      successMessage = 'The project was transfered successfully.';
      errorMessage = 'The project was not transfered successfully.';
      break;
    case 'DELETE_PROJECT':
      successMessage = 'The project was deleted successfully.';
      errorMessage =
        'The project was not deleted successfully. This project might have some contributions.';
      break;
    default:
      return null;
  }
  if (error === null) {
    return null;
  }

  if (error === false) {
    return <p className="pv2 white tc bg-dark-green">{successMessage}</p>;
  } else {
    return <p className="pv2 white tc bg-light-red">{errorMessage}</p>;
  }
};

const ResetTasksModal = ({ projectId, close }: Object) => {
  const token = useSelector(state => state.auth.get('token'));
  const [error, setError] = useState(null);

  const fn = () => {
    fetchLocalJSONAPI(`projects/${projectId}/tasks/actions/reset-all/`, token, 'POST')
      .then(res => setError(false))
      .catch(e => setError(true));
  };

  const handlerButton = e => {
    fn();
  };

  return (
    <div className={styleClasses.modalClass}>
      <h2 className={styleClasses.modalTitleClass}>Task reset</h2>

      <p className={styleClasses.pClass + ' pb3'}>
        Are you sure you want to reset all tasks? You cannot undo this.
      </p>

      {checkError(error, 'RESET_ALL')}
      <Button className={styleClasses.drawButtonClass + ' mr2'} onClick={handlerButton}>
        Reset all tasks
      </Button>
      <Button className={styleClasses.deleteButtonClass} onClick={close}>
        Close
      </Button>
    </div>
  );
};

const ResetBadImageryModal = ({ projectId, close }: Object) => {
  const token = useSelector(state => state.auth.get('token'));
  const [error, setError] = useState(null);

  const fn = () => {
    fetchLocalJSONAPI(`projects/${projectId}/tasks/actions/reset-all-badimagery/`, token, 'POST')
      .then(res => setError(false))
      .catch(e => setError(true));
  };

  const handlerButton = e => {
    fn();
  };

  return (
    <div className={styleClasses.modalClass}>
      <h2 className={styleClasses.modalTitleClass}>Reset Bad Imagery Tasks</h2>

      <p className={styleClasses.pClass + ' pb3'}>
        Are you sure you want to mark all bad imagery tasks in this project as ready? You cannot
        undo this.
      </p>
      <p className={styleClasses.pClass + ' pb5 mt4'}>
        This will mark all bad imagery tasks as ready. Please use this only if you are sure of what
        you are doing.
      </p>

      {checkError(error, 'RESET_BAD_IMAGERY')}
      <Button className={styleClasses.drawButtonClass + ' mr2'} onClick={handlerButton}>
        Reset all bad imagery tasks
      </Button>
      <Button className={styleClasses.deleteButtonClass} onClick={close}>
        Close
      </Button>
    </div>
  );
};

const ValidateAllTasksModal = ({ projectId, close }: Object) => {
  const token = useSelector(state => state.auth.get('token'));
  const [error, setError] = useState(null);

  const fn = () => {
    fetchLocalJSONAPI(`projects/${projectId}/tasks/actions/validate-all/`, token, 'POST')
      .then(res => setError(false))
      .catch(e => setError(true));
  };

  const handlerButton = e => {
    fn();
  };

  return (
    <div className={styleClasses.modalClass}>
      <h2 className={styleClasses.modalTitleClass}>Task validation</h2>

      <p className={styleClasses.pClass + ' pb3'}>
        Are you sure you want to validate all tasks? You cannot undo this.
      </p>
      <p className={styleClasses.pClass + ' pb5 mt4'}>
        This will mark all tasks (except bad imagery) as valid. Please use this only if you are sure
        of what you are doing.
      </p>

      {checkError(error, 'VALIDATE_ALL_TASKS')}
      <Button className={styleClasses.drawButtonClass + ' mr2'} onClick={handlerButton}>
        Validate all tasks
      </Button>
      <Button className={styleClasses.deleteButtonClass} onClick={close}>
        Close
      </Button>
    </div>
  );
};

const InvalidateAllTasksModal = ({ projectId, close }: Object) => {
  const token = useSelector(state => state.auth.get('token'));
  const [error, setError] = useState(null);

  const fn = () => {
    fetchLocalJSONAPI(`projects/${projectId}/tasks/actions/invalidate-all/`, token, 'POST')
      .then(res => setError(false))
      .catch(e => setError(true));
  };

  const handlerButton = e => {
    fn();
  };

  return (
    <div className={styleClasses.modalClass}>
      <h2 className={styleClasses.modalTitleClass}>Task Invalidation</h2>

      <p className={styleClasses.pClass + ' pb3'}>
        Are you sure you want to invalidate all tasks in this project? You cannot undo this.
      </p>
      <p className={styleClasses.pClass + ' pb5 mt4'}>
        This will mark all tasks (except non completed and bad imagery tasks) as invalid. Please use
        this only if you are sure of what you are doing.
      </p>

      {checkError(error, 'INVALIDATE_ALL_TASKS')}
      <Button className={styleClasses.drawButtonClass + ' mr2'} onClick={handlerButton}>
        Invalidate all tasks
      </Button>
      <Button className={styleClasses.deleteButtonClass} onClick={close}>
        Close
      </Button>
    </div>
  );
};

const MapAllTasksModal = ({ projectId, close }: Object) => {
  const token = useSelector(state => state.auth.get('token'));
  const [error, setError] = useState(null);

  const fn = () => {
    fetchLocalJSONAPI(`projects/${projectId}/tasks/actions/map-all/`, token, 'POST')
      .then(res => setError(false))
      .catch(e => setError(true));
  };

  const handlerButton = e => {
    fn();
  };

  return (
    <div className={styleClasses.modalClass}>
      <h2 className={styleClasses.modalTitleClass}>Task Mapping</h2>
      <p className={styleClasses.pClass + ' pb3'}>
        Are you sure you want to mark all tasks in this project as mapped? You cannot undo this.
      </p>
      <p className={styleClasses.pClass + ' pb5 mt4'}>
        This will mark all tasks (except bad imagery tasks) as mapped. Please use this only if you
        are sure of what you are doing.
      </p>
      {checkError(error, 'MAP_ALL_TASKS')}
      <Button className={styleClasses.drawButtonClass + ' mr2'} onClick={handlerButton}>
        Map all tasks
      </Button>
      <Button className={styleClasses.deleteButtonClass} onClick={close}>
        Close
      </Button>
    </div>
  );
};

const MessageContributorsModal = ({ projectId, close }: Object) => {
  const [data, setData] = useState({ message: '', subject: '' });
  const token = useSelector(state => state.auth.get('token'));
  const [error, setError] = useState(null);

  const fn = () => {
    pushToLocalJSONAPI(
      `projects/${projectId}/actions/message-contributors/`,
      JSON.stringify(data),
      token,
      'POST',
    )
      .then(res => setError(false))
      .catch(e => setError(true));
  };

  const handleChange = e => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handlerButton = e => {
    fn();
  };

  return (
    <div className={styleClasses.modalClass}>
      <h2 className={styleClasses.modalTitleClass}>Message all contributors</h2>

      <p className={styleClasses.pClass + ' pb3'}>
        This will send a Tasking Manager message to every contributor of the current project. Please
        use this feature carefully.
      </p>
      <input
        value={data.subject}
        onChange={handleChange}
        name="subject"
        className="db w-50 center pv1 mb3"
        type="text"
        placeholder="Subject *"
      />
      <input
        value={data.message}
        onChange={handleChange}
        name="message"
        className="w-50 center h2"
        type="textarea"
        placeholder="Message *"
        rows="4"
      />

      <p className={styleClasses.pClass + ' pb5 mt4'}>
        This message is not translated to the selected language of the user, so you may want to
        include your own translations.
      </p>
      {checkError(error, 'MESSAGE_CONTRIBUTORS')}
      <Button className={styleClasses.drawButtonClass + ' mr2'} onClick={handlerButton}>
        Message all contributors
      </Button>
      <Button className={styleClasses.deleteButtonClass} onClick={close}>
        Close
      </Button>
    </div>
  );
};

const TransferProject = ({ projectId }: Object) => {
  const token = useSelector(state => state.auth.get('token'));
  const [error, setError] = useState(null);
  const [username, setUsername] = useState('');
  const [users, setUsers] = useState([]);
  const handleUsers = e => {
    const fetchUsers = user => {
      fetchLocalJSONAPI(`users/queries/filter/${user}/`, token)
        .then(res => setUsers(res.usernames))
        .catch(e => setUsers([]));
    };

    const user = e.target.value;
    setUsername(user);
    fetchUsers(user);
  };

  const fn = () => {
    pushToLocalJSONAPI(
      `projects/${projectId}/actions/transfer-ownership/`,
      JSON.stringify({ username: username }),
      token,
      'POST',
    )
      .then(res => setError(false))
      .catch(e => setError(true));
  };

  const handlerButton = e => {
    fn();
  };

  // Redirect on success.
  if (error === false) {
    setTimeout(() => (window.location.href = '/explore'), 3000);
  }

  return (
    <div>
      <Popup
        contentStyle={{ padding: 0, border: 0 }}
        arrow={false}
        trigger={
          <input
            className={styleClasses.inputClass.replace('80', '40') + ' pa2 fl mr2'}
            type="text"
            value={username}
            name="transferuser"
            onChange={handleUsers}
          />
        }
        on="focus"
        position="bottom left"
        open={users.length !== 0 ? true : false}
      >
        <div>
          {users.map((u, n) => (
            <span
              className="db pa1 pointer"
              key={n}
              onClick={() => {
                setUsername(u);
                setUsers([]);
              }}
            >
              {u}
            </span>
          ))}
        </div>
      </Popup>
      <Button onClick={handlerButton} className={styleClasses.buttonClass}>
        Transfer project
      </Button>
      {checkError(error, 'TRANSFER_PROJECT')}
    </div>
  );
};

export const ActionsForm = ({ projectId, projectName }: Object) => {
  const modalStyle = {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    opacity: '0.95',
  };

  return (
    <div className="w-100">
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>Message all contributors</label>
        <Popup
          trigger={<Button className={styleClasses.actionClass}>Message all contributors</Button>}
          contentStyle={modalStyle}
          modal
          closeOnDocumentClick
        >
          {close => <MessageContributorsModal projectId={projectId} close={close} />}
        </Popup>
      </div>
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>Mapping, Validation and Invalidation</label>
        <p className={styleClasses.pClass}>
          Use this if for some reason you need to map, validate or invalidate all tasks in this
          project in a single step.
        </p>
        <p className={styleClasses.pClass}>
          <b>Warning:</b> This cannot be undone.
        </p>
        <Popup
          trigger={<Button className={styleClasses.actionClass}>Map all tasks</Button>}
          contentStyle={modalStyle}
          modal
          closeOnDocumentClick
        >
          {close => <MapAllTasksModal projectId={projectId} close={close} />}
        </Popup>
        <Popup
          trigger={<Button className={styleClasses.actionClass}>Invalidate all tasks</Button>}
          contentStyle={modalStyle}
          modal
          closeOnDocumentClick
        >
          {close => <InvalidateAllTasksModal projectId={projectId} close={close} />}
        </Popup>
        <Popup
          trigger={<Button className={styleClasses.actionClass}>Validate all tasks</Button>}
          contentStyle={modalStyle}
          modal
          closeOnDocumentClick
        >
          {close => <ValidateAllTasksModal projectId={projectId} close={close} />}
        </Popup>
        <Popup
          trigger={
            <Button className={styleClasses.actionClass}>Reset all bad imagery tasks</Button>
          }
          contentStyle={modalStyle}
          modal
          closeOnDocumentClick
        >
          {close => <ResetBadImageryModal projectId={projectId} close={close} />}
        </Popup>
      </div>
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>Delete project</label>
        <p className={styleClasses.pClass}>You can only delete projects with no contributions.</p>
        <p className={styleClasses.pClass}>
          <b>Warning:</b> This cannot be undone.
        </p>
        <DeleteModal
          id={projectId}
          name={projectName}
          type={'projects'}
          className="pointer bg-red white"
        />
      </div>
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>Transfer project ownership</label>
        <p className={styleClasses.pClass}>
          <b>Warning:</b> This cannot be undone by you. In case of wrong transfer, contact the new
          owner to revert the change.
        </p>
        <TransferProject projectId={projectId} />
      </div>
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>Reset Tasks</label>
        <p className={styleClasses.pClass}>
          Reset all tasks in the project to ready to map, preserving history.
        </p>
        <p className={styleClasses.pClass}>
          <b>Warning:</b> This cannot be undone.
        </p>
        <Popup
          trigger={<Button className={styleClasses.actionClass}>Reset tasks</Button>}
          contentStyle={modalStyle}
          modal
          closeOnDocumentClick
        >
          {close => <ResetTasksModal projectId={projectId} close={close} />}
        </Popup>
      </div>
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>Clone Project</label>
        <p className={styleClasses.pClass}>
          This will clone all descriptions, instructions, metadata etc. The Area of Interest, the
          tasks and the priority areas will not be cloned. You will have to redraw/import these.
          Your newly cloned project will be in draft status.
        </p>
        <Button
          onClick={() => navigate(`/manage/projects/new/?cloneFrom=${projectId}`)}
          className={styleClasses.actionClass}
        >
          Clone project
        </Button>
      </div>
    </div>
  );
};
