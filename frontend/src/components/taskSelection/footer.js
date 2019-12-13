import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { navigate } from '@reach/router';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { getEditors } from '../../utils/editorsList';
import { pushToLocalJSONAPI, fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import { Dropdown } from '../dropdown';
import { Button } from '../button';
import { Imagery } from './imagery';
import { MappingTypes } from '../mappingTypes';

export function ContributeButton({ action, projectId, selectedTasks, activities }: Object) {
  const token = useSelector(state => state.auth.get('token'));
  const dispatch = useDispatch();

  const updateReduxState = (tasks, project, status) => {
    dispatch({type: 'SET_LOCKED_TASKS', tasks: tasks});
    dispatch({type: 'SET_PROJECT', project: project});
    dispatch({type: 'SET_TASKS_STATUS', status: status});
  }
  const lockTasks = () => {
    if (action.startsWith('validate')) {
      pushToLocalJSONAPI(
        `/api/v2/projects/${projectId}/tasks/actions/lock-for-validation/`,
        JSON.stringify({taskIds: selectedTasks}),
        token
      ).then(
        res => {
          updateReduxState(selectedTasks, projectId, 'LOCKED_FOR_VALIDATION');
          navigate(`/projects/${projectId}/validate/`);
        }
      ).catch(e => console.log(e));
    }
    if (action.startsWith('map')) {
      fetchLocalJSONAPI(
        `/api/v2/projects/${projectId}/tasks/actions/lock-for-mapping/${selectedTasks[0]}/`,
        token,
        'POST'
      ).then(
        res => {
          updateReduxState(selectedTasks, projectId, 'LOCKED_FOR_MAPPING');
          navigate(`/projects/${projectId}/map/`);
        }
      ).catch(e => console.log(e));
    }
  };

  return (
    <Button className="white bg-red" onClick={() => lockTasks()}>
      <FormattedMessage {...messages[action]} />
    </Button>
  );
}

export const TaskSelectionFooter = props => {
  const [editor, setEditor] = useState(props.defaultUserEditor);
  const [editorOptions, setEditorOptions] = useState([]);
  const titleClasses = 'db ttu f6 blue-light mb2';

  useEffect(() => {
    if (props.taskAction && props.mappingEditors && props.taskAction.startsWith('validate')) {
      setEditorOptions(getEditors().filter(i => props.validationEditors.includes(i.backendValue)));
    } else {
      setEditorOptions(getEditors().filter(i => props.mappingEditors.includes(i.backendValue)));
    }
  }, [props.taskAction, props.mappingEditors, props.validationEditors]);

  const updateEditor = arr => setEditor(arr[0].value);

  return (
    <div className="cf bg-white pb2 ph4-l ph2">
      <div className="w-25-ns w-40 fl">
        <h3 className={titleClasses}>
          <FormattedMessage {...messages.typesOfMapping} />
        </h3>
        <div className="db fl pt1">
          <MappingTypes types={props.mappingTypes} />
        </div>
      </div>
      <div className="w-25-ns w-60 fl">
        <h3 className={titleClasses}>
          <FormattedMessage {...messages.imagery} />
        </h3>
        <Imagery value={props.imagery} />
      </div>
      <div className="w-20-ns w-40 fl">
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
      <div className="w-30-ns w-60 fl tr">
        <div className="mt3">
          {/* type value will be changed soon */}
          <ContributeButton action={props.taskAction} selectedTasks={props.selectedTasks} projectId={props.projectId} />
        </div>
      </div>
    </div>
  );
};
