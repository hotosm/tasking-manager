import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { navigate } from '@reach/router';
import Popup from 'reactjs-popup';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { getEditors } from '../../utils/editorsList';
import { openEditor, formatJosmUrl } from '../../utils/openEditor';
import { useFetchLockedTasks } from '../../hooks/UseLockedTasks';
import { pushToLocalJSONAPI, fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import { Dropdown } from '../dropdown';
import { Button } from '../button';
import { Imagery } from './imagery';
import { MappingTypes } from '../mappingTypes';
import { LockedTaskModalContent } from './lockedTasks';

const TaskSelectionFooter = ({ defaultUserEditor, project, tasks, taskAction, selectedTasks }) => {
  const token = useSelector((state) => state.auth.get('token'));
  const locale = useSelector((state) => state.preferences.locale);
  const [editor, setEditor] = useState(defaultUserEditor);
  const [editorOptions, setEditorOptions] = useState([]);
  const [lockError, setLockError] = useState(null);
  const dispatch = useDispatch();
  const fetchLockedTasks = useFetchLockedTasks();

  const lockSuccess = (status, endpoint, windowObjectReference) => {
    const urlParams = openEditor(
      editor,
      project,
      tasks,
      selectedTasks,
      [window.innerWidth, window.innerHeight],
      windowObjectReference,
      locale,
    );
    updateReduxState(selectedTasks, project.projectId, status);
    navigate(`/projects/${project.projectId}/${endpoint}/${urlParams}`);
  };

  const lockFailed = (windowObjectReference, message) => {
    // JOSM and iD don't open a new window
    if (!['JOSM', 'ID'].includes(editor)) {
      windowObjectReference.close();
    }
    fetchLockedTasks();
    setLockError(message);
  };

  const updateReduxState = (tasks, project, status) => {
    dispatch({ type: 'SET_LOCKED_TASKS', tasks: tasks });
    dispatch({ type: 'SET_PROJECT', project: project });
    dispatch({ type: 'SET_TASKS_STATUS', status: status });
  };

  const lockTasks = async () => {
    // if user can not map or validate the project, lead him to the explore projects page
    if (['selectAnotherProject', 'mappingIsComplete', 'projectIsComplete'].includes(taskAction)) {
      navigate(`/explore/`);
    }
    // then pass to the JOSM check and validate/map checks
    if (editor === 'JOSM' && !window.safari) {
      try {
        await fetch(formatJosmUrl('version', { jsonp: 'checkJOSM' }));
      } catch (e) {
        setLockError('JOSM');
        return;
      }
    }
    let windowObjectReference;
    if (!['JOSM', 'ID'].includes(editor)) {
      windowObjectReference = window.open('', `TM-${project.projectId}-${selectedTasks}`);
    }
    if (['validateSelectedTask', 'validateAnotherTask', 'validateATask'].includes(taskAction)) {
      pushToLocalJSONAPI(
        `projects/${project.projectId}/tasks/actions/lock-for-validation/`,
        JSON.stringify({ taskIds: selectedTasks }),
        token,
      )
        .then((res) => {
          lockSuccess('LOCKED_FOR_VALIDATION', 'validate', windowObjectReference);
        })
        .catch((e) => lockFailed(windowObjectReference, e.message));
    }
    if (['mapSelectedTask', 'mapAnotherTask', 'mapATask'].includes(taskAction)) {
      fetchLocalJSONAPI(
        `projects/${project.projectId}/tasks/actions/lock-for-mapping/${selectedTasks[0]}/`,
        token,
        'POST',
      )
        .then((res) => {
          lockSuccess('LOCKED_FOR_MAPPING', 'map', windowObjectReference);
        })
        .catch((e) => lockFailed(windowObjectReference, e.message));
    }
    if (['resumeMapping', 'resumeValidation'].includes(taskAction)) {
      const urlParams = openEditor(
        editor,
        project,
        tasks,
        selectedTasks,
        [window.innerWidth, window.innerHeight],
        windowObjectReference,
        locale,
      );
      const endpoint = taskAction === 'resumeMapping' ? 'map' : 'validate';
      navigate(`/projects/${project.projectId}/${endpoint}/${urlParams}`);
    }
  };

  // update the editors options for mapping or for validation,
  // according to the status of the task that is currently selected
  useEffect(() => {
    if (
      taskAction &&
      project.mappingEditors &&
      (taskAction.startsWith('validate') || taskAction === 'resumeValidation')
    ) {
      const validationEditorOptions = getEditors(project.validationEditors, project.customEditor);
      setEditorOptions(validationEditorOptions);
      // activate defaultUserEditor if it's allowed. If not, use the first allowed editor for validation
      if (project.validationEditors.includes(defaultUserEditor)) {
        setEditor(defaultUserEditor);
      } else {
        updateEditor(validationEditorOptions);
      }
    } else {
      const mappingEditorOptions = getEditors(project.mappingEditors, project.customEditor);
      setEditorOptions(mappingEditorOptions);
      // activate defaultUserEditor if it's allowed. If not, use the first allowed editor
      if (project.mappingEditors.includes(defaultUserEditor)) {
        setEditor(defaultUserEditor);
      } else {
        updateEditor(mappingEditorOptions);
      }
    }
  }, [
    taskAction,
    project.mappingEditors,
    project.validationEditors,
    project.customEditor,
    defaultUserEditor,
  ]);

  const updateEditor = (arr) => setEditor(arr[0].value);
  const titleClasses = 'db ttu f6 blue-light mb2 truncate';
  return (
    <div className="bg-white pb2 ph4-l ph2 flex flex-nowrap-ns flex-wrap">
      {lockError !== null && (
        <Popup
          modal
          open
          closeOnEscape={true}
          closeOnDocumentClick={true}
          onClose={() => setLockError(null)}
        >
          {(close) => (
            <LockedTaskModalContent
              project={project}
              error={lockError}
              close={close}
              lockTasks={lockTasks}
            />
          )}
        </Popup>
      )}
      {/* Types of mapping */}
      <div className="w-25-ns w-40 order-0-ns order-4">
        <div className="db-ns dn">
          <h3 className={titleClasses}>
            <FormattedMessage {...messages.typesOfMapping} />
          </h3>
        </div>
        <div className="mr2-ns pt1">
          <MappingTypes types={project.mappingTypes} />
        </div>
      </div>
      {/* Imagery */}
      <div className="w-25-ns w-60 order-1">
        <h3 className={titleClasses}>
          <FormattedMessage {...messages.imagery} />
        </h3>
        <div className="pt1 mr1-ns">
          <Imagery value={project.imagery} />
        </div>
      </div>
      {/* Select editor */}
      <div className="w-25-ns w-60 order-2">
        <h3 className={titleClasses}>
          <FormattedMessage {...messages.editor} />
        </h3>
        <Dropdown
          options={editorOptions}
          value={editor}
          display={<FormattedMessage {...messages.selectEditor} />}
          className="bg-white bn"
          toTop={true}
          onChange={updateEditor}
          onAdd={() => {}}
          onRemove={() => {}}
        />
      </div>
      {/* The "Map a task" etc. button */}
      <div className="w-25-ns w-40 order-3-ns order-1 tr-ns tc mb0-ns mb1">
        <div className="mt3">
          <Button className="white bg-red" onClick={() => lockTasks()}>
            {['selectAnotherProject', 'mappingIsComplete', 'projectIsComplete'].includes(
              taskAction,
            ) ? (
              <FormattedMessage {...messages.selectAnotherProject} />
            ) : (
              <FormattedMessage
                {...messages[taskAction]}
                values={{ number: selectedTasks ? selectedTasks.length : 0 }}
              />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TaskSelectionFooter;
