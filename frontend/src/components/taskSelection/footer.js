import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { navigate } from '@reach/router';
import { FormattedMessage } from 'react-intl';
import Popup from 'reactjs-popup';

import messages from './messages';
import { getEditors } from '../../utils/editorsList';
import { openEditor } from '../../utils/openEditor';
import { useFetchLockedTasks } from '../../hooks/UseLockedTasks';
import { pushToLocalJSONAPI, fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import { Dropdown } from '../dropdown';
import { Button } from '../button';
import { Imagery } from './imagery';
import { MappingTypes } from '../mappingTypes';
import { LockedTaskModalContent } from './lockedTasks';

const TaskSelectionFooter = props => {
  const token = useSelector(state => state.auth.get('token'));
  const [editor, setEditor] = useState(props.defaultUserEditor);
  const [editorOptions, setEditorOptions] = useState([]);
  const [lockError, setLockError] = useState(false);
  const dispatch = useDispatch();
  const fetchLockedTasks = useFetchLockedTasks();

  const lockSuccess = (status, endpoint, windowObjectReference) => {
    openEditor(
      editor,
      props.project,
      props.tasks,
      props.selectedTasks,
      [window.innerWidth, window.innerHeight],
      windowObjectReference,
    );
    updateReduxState(props.selectedTasks, props.project.projectId, status);
    navigate(`/projects/${props.project.projectId}/${endpoint}/`);
  };

  const lockFailed = windowObjectReference => {
    windowObjectReference.close();
    fetchLockedTasks();
    setLockError(true);
  };

  const updateReduxState = (tasks, project, status) => {
    dispatch({ type: 'SET_LOCKED_TASKS', tasks: tasks });
    dispatch({ type: 'SET_PROJECT', project: project });
    dispatch({ type: 'SET_TASKS_STATUS', status: status });
  };
  const lockTasks = () => {
    const windowObjectReference = window.open(
      '',
      `iD-${props.project.projectId}-${props.selectedTasks}`,
    );
    if (
      ['validateSelectedTask', 'validateAnotherTask', 'validateATask'].includes(props.taskAction)
    ) {
      pushToLocalJSONAPI(
        `projects/${props.project.projectId}/tasks/actions/lock-for-validation/`,
        JSON.stringify({ taskIds: props.selectedTasks }),
        token,
      )
        .then(res => {
          lockSuccess('LOCKED_FOR_VALIDATION', 'validate', windowObjectReference);
        })
        .catch(e => lockFailed(windowObjectReference));
    }
    if (['mapSelectedTask', 'mapAnotherTask', 'mapATask'].includes(props.taskAction)) {
      fetchLocalJSONAPI(
        `projects/${props.project.projectId}/tasks/actions/lock-for-mapping/${
          props.selectedTasks[0]
        }/`,
        token,
        'POST',
      )
        .then(res => {
          lockSuccess('LOCKED_FOR_MAPPING', 'map', windowObjectReference);
        })
        .catch(e => lockFailed(windowObjectReference));
    }
    if (['resumeMapping', 'resumeValidation'].includes(props.taskAction)) {
      openEditor(editor, props.project, props.tasks, props.selectedTasks, [
        window.innerWidth,
        window.innerHeight,
      ]);
      const endpoint = props.taskAction === 'resumeMapping' ? 'map' : 'validate';
      navigate(`/projects/${props.project.projectId}/${endpoint}/`);
    }
    // if user can not map or validate the project, lead him to the explore projects page
    if (
      ['selectAnotherProject', 'mappingIsComplete', 'projectIsComplete'].includes(props.taskAction)
    ) {
      navigate(`/explore/`);
    }
  };

  // update the editors options for mapping or for validation,
  // according to the status of the task that is currently selected
  useEffect(() => {
    if (
      props.taskAction &&
      props.project.mappingEditors &&
      (props.taskAction.startsWith('validate') || props.taskAction === 'resumeValidation')
    ) {
      const validationEditorOptions = getEditors(
        props.project.validationEditors,
        props.project.customEditor,
      );
      setEditorOptions(validationEditorOptions);
      updateEditor(validationEditorOptions);
    } else {
      const mappingEditorOptions = getEditors(
        props.project.mappingEditors,
        props.project.customEditor,
      );
      setEditorOptions(mappingEditorOptions);
      updateEditor(mappingEditorOptions);
    }
  }, [
    props.taskAction,
    props.project.mappingEditors,
    props.project.validationEditors,
    props.project.customEditor,
  ]);

  const updateEditor = arr => setEditor(arr[0].value);
  const titleClasses = 'db ttu f6 blue-light mb2';

  return (
    <div className="cf bg-white pb2 ph4-l ph2">
      {lockError && (
        <Popup
          modal
          open
          closeOnEscape={true}
          closeOnDocumentClick={true}
          onClose={() => setLockError(false)}
        >
          {close => <LockedTaskModalContent project={props.project.projectId} />}
        </Popup>
      )}
      <div className="w-25-ns w-40 fl">
        <h3 className={titleClasses}>
          <FormattedMessage {...messages.typesOfMapping} />
        </h3>
        <div className="db fl pt1">
          <MappingTypes types={props.project.mappingTypes} />
        </div>
      </div>
      <div className="w-25-ns w-60 fl">
        <h3 className={titleClasses}>
          <FormattedMessage {...messages.imagery} />
        </h3>
        <Imagery value={props.project.imagery} />
      </div>
      <div className="w-20-ns w-40 fl">
        <h3 className={titleClasses}>
          <FormattedMessage {...messages.editor} />
        </h3>
        <Dropdown
          options={editorOptions}
          value={
            editorOptions.map(i => i.value).includes(editor)
              ? editor
              : editorOptions.length && editorOptions[0].value
          }
          display={<FormattedMessage {...messages.selectEditor} />}
          className="bg-white bn"
          toTop={true}
          onChange={updateEditor}
          onAdd={() => {}}
          onRemove={() => {}}
        />
      </div>
      <div className="w-30-ns w-60 fl tr">
        <div className="mt3">
          <Button className="white bg-red" onClick={() => lockTasks()}>
            {['selectAnotherProject', 'mappingIsComplete', 'projectIsComplete'].includes(
              props.taskAction,
            ) ? (
              <FormattedMessage {...messages.selectAnotherProject} />
            ) : (
              <FormattedMessage {...messages[props.taskAction]} />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TaskSelectionFooter;
