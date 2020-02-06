import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { navigate } from '@reach/router';
import ReactPlaceholder from 'react-placeholder';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { ProjectInstructions } from './instructions';
import { TasksMap } from './map';
import { HeaderLine } from '../projectDetail/header';
import { Button } from '../button';
import { Dropdown } from '../dropdown';
import { CheckCircle } from '../checkCircle';
import DueDateBox from '../projectcard/dueDateBox';
import { CloseIcon } from '../svgIcons';
import { getEditors } from '../../utils/editorsList';
import { openEditor } from '../../utils/openEditor';
import { pushToLocalJSONAPI, fetchLocalJSONAPI } from '../../network/genericJSONRequest';

export function TaskMapAction({ project, tasks, action, editor }) {
  const [activeSection, setActiveSection] = useState('completion');
  const [activeEditor, setActiveEditor] = useState(editor);
  const tasksIds = tasks && tasks.features ? tasks.features.map(i => i.properties.taskId) : [];
  const callEditor = arr => {
    setActiveEditor(arr[0].value);
    openEditor(arr[0].value, project, tasks, tasksIds, [window.innerWidth, window.innerHeight]);
  };

  return (
    <div className="cf vh-minus-122-ns overflow-y-hidden">
      <div className="w-70 fl h-100 relative">
        <ReactPlaceholder
          showLoadingAnimation={true}
          type="media"
          rows={26}
          delay={10}
          ready={tasks !== undefined && tasks.features !== undefined}
        >
          <TasksMap
            mapResults={tasks}
            className="dib w-100 fl h-100-ns vh-75"
            taskBordersOnly={false}
            animateZoom={false}
          />
        </ReactPlaceholder>
      </div>
      <div className="w-30 fr pt3 ph3 h-100 overflow-y-scroll">
        <ReactPlaceholder
          showLoadingAnimation={true}
          rows={3}
          ready={typeof project.projectId === 'number' && project.projectId > 0}
        >
          <HeaderLine author={project.author} projectId={project.projectId} />
          <div className="cf pb3">
            <h3 className="f2 fw6 mt2 mb3 ttu barlow-condensed blue-dark">
              {project.projectInfo && project.projectInfo.name}
              <span className="pl2">&#183;</span>
              {tasksIds.map((task, n) => (
                <span key={n} className="red ph2">{`#${task}`}</span>
              ))}
            </h3>
            <div>
              <DueDateBox dueDate={project.dueDate} align="left" />
            </div>
          </div>
          <div className="cf">
            <div className="cf ttu barlow-condensed f4 pv2 blue-dark">
              <span
                className={`mr4-l mr3 pb2 pointer ${activeSection === 'completion' &&
                  'bb b--blue-dark'}`}
                onClick={() => setActiveSection('completion')}
              >
                <FormattedMessage {...messages.completion} />
              </span>
              <span
                className={`mr4-l mr3 pb2 pointer ${activeSection === 'instructions' &&
                  'bb b--blue-dark'}`}
                onClick={() => setActiveSection('instructions')}
              >
                <FormattedMessage {...messages.instructions} />
              </span>
              <span
                className={`mr4-l mr3 pb2 pointer ${activeSection === 'history' &&
                  'bb b--blue-dark'}`}
                onClick={() => setActiveSection('history')}
              >
                <FormattedMessage {...messages.history} />
              </span>
            </div>
          </div>
          <div className="pt3">
            {activeSection === 'completion' && action === 'MAPPING' && (
              <>
                <CompletionInstructions />
                <ReopenEditor
                  project={project}
                  action={action}
                  editor={activeEditor}
                  callEditor={callEditor}
                />
                <CompletionTabForMapping project={project} tasksIds={tasksIds} />
              </>
            )}
            {activeSection === 'completion' && action === 'VALIDATION' && (
              <>
                <ReopenEditor
                  project={project}
                  action={action}
                  editor={activeEditor}
                  callEditor={callEditor}
                />
                <CompletionTabForValidation project={project} tasksIds={tasksIds} />
              </>
            )}
            {activeSection === 'instructions' && (
              <ProjectInstructions
                instructions={project.projectInfo && project.projectInfo.instructions}
              />
            )}
            {activeSection === 'history' && <div></div>}
          </div>
        </ReactPlaceholder>
      </div>
    </div>
  );
}

function CompletionTabForMapping({ project, tasksIds }: Object) {
  const token = useSelector(state => state.auth.get('token'));
  const [selectedStatus, setSelectedStatus] = useState();
  const [taskComment, setTaskComment] = useState('');
  const radioInput = 'radio-input input-reset pointer v-mid dib h2 w2 mr2 br-100 ba b--blue-light';

  const splitTask = () => {
    fetchLocalJSONAPI(
      `projects/${project.projectId}/tasks/actions/split/${tasksIds[0]}/`,
      token,
      'POST',
    ).then(r => navigate(`../tasks/`));
  };

  const stopMapping = () => {
    pushToLocalJSONAPI(
      `projects/${project.projectId}/tasks/actions/stop-mapping/${tasksIds[0]}/`,
      '{}',
      token,
    ).then(r => navigate(`/projects/${project.projectId}/tasks/`));
  };

  const submitTask = () => {
    if (selectedStatus) {
      let url;
      let payload = { comment: taskComment };
      if (selectedStatus === 'MAPPED') {
        url = `projects/${project.projectId}/tasks/actions/unlock-after-mapping/${tasksIds[0]}/`;
        payload.status = 'MAPPED';
      }
      if (selectedStatus === 'READY') {
        url = `projects/${project.projectId}/tasks/actions/stop-mapping/${tasksIds[0]}/`;
      }
      if (selectedStatus === 'BADIMAGERY') {
        url = `projects/${project.projectId}/tasks/actions/stop-mapping/${tasksIds[0]}/`;
      }
      pushToLocalJSONAPI(url, JSON.stringify(payload), token).then(r =>
        navigate(`/projects/${project.projectId}/tasks/`),
      );
    }
  };

  return (
    <div>
      <div className="bb b--grey-light w-100"></div>
      <div className="cf">
        <h4 className="ttu blue-grey f5">
          <FormattedMessage {...messages.editStatus} />
        </h4>
        <p>
          <input
            id="MAPPED"
            type="radio"
            value="MAPPED"
            className={radioInput}
            checked={selectedStatus === 'MAPPED'}
            onClick={() => setSelectedStatus('MAPPED')}
          />
          <label htmlFor="MAPPED">
            <FormattedMessage {...messages.completelyMapped} />
          </label>
        </p>
        <p>
          <input
            id="READY"
            type="radio"
            value="READY"
            className={radioInput}
            checked={selectedStatus === 'READY'}
            onClick={() => setSelectedStatus('READY')}
          />
          <label htmlFor="READY">
            <FormattedMessage {...messages.incomplete} />
          </label>
        </p>
        <p>
          <input
            id="BADIMAGERY"
            type="radio"
            value="BADIMAGERY"
            className={radioInput}
            checked={selectedStatus === 'BADIMAGERY'}
            onClick={() => setSelectedStatus('BADIMAGERY')}
          />
          <label htmlFor="BADIMAGERY">
            <FormattedMessage {...messages.badImagery} />
          </label>
        </p>
      </div>
      <div className="cf">
        <h4 className="ttu blue-grey f5">
          <FormattedMessage {...messages.comment} />
        </h4>
        <p>
          <textarea onChange={e => setTaskComment(e.target.value)} rows="2" className="w-100 pa2" />
        </p>
      </div>
      <div className="cf">
        <Button className="bg-blue-dark white w-50 fl" onClick={() => splitTask()}>
          <FormattedMessage {...messages.splitTask} />
        </Button>
        <Button className="blue-dark bg-white w-50 fl" onClick={() => stopMapping()}>
          <FormattedMessage {...messages.selectAnotherTask} />
        </Button>
      </div>
      <div className="cf mv2">
        <Button
          className="bg-red white w-100 fl"
          onClick={() => submitTask()}
          disabled={!selectedStatus}
        >
          <FormattedMessage {...messages.submitTask} />
        </Button>
      </div>
    </div>
  );
}

function CompletionTabForValidation({ project, tasksIds }: Object) {
  const token = useSelector(state => state.auth.get('token'));
  const [selectedStatus, setSelectedStatus] = useState();
  const [taskComment, setTaskComment] = useState('');
  const radioInput = 'radio-input input-reset pointer v-mid dib h2 w2 mr2 br-100 ba b--blue-light';

  const stopValidation = () => {
    pushToLocalJSONAPI(
      `projects/${project.projectId}/tasks/actions/stop-validation/`,
      JSON.stringify({ resetTasks: [{ taskId: tasksIds[0], comment: taskComment }] }),
      token,
    ).then(r => navigate(`../tasks/`));
  };

  const submitTask = () => {
    if (selectedStatus) {
      let url;
      let payload = { validatedTasks: [{ comment: taskComment, taskId: tasksIds[0] }] };
      if (selectedStatus === 'VALIDATED') {
        url = `projects/${project.projectId}/tasks/actions/unlock-after-validation/`;
        payload.validatedTasks[0].status = 'VALIDATED';
      }
      if (selectedStatus === 'INVALIDATED') {
        url = `projects/${project.projectId}/tasks/actions/unlock-after-validation/`;
        payload.validatedTasks[0].status = 'INVALIDATED';
      }
      pushToLocalJSONAPI(url, JSON.stringify(payload), token).then(r => navigate(`../tasks/`));
    }
  };

  return (
    <div>
      <div className="bb b--grey-light w-100"></div>
      <div className="cf">
        <h4 className="ttu blue-grey f5">
          <FormattedMessage {...messages.editStatus} />
        </h4>
        <p>
          <input
            type="radio"
            value="VALIDATED"
            className={radioInput}
            checked={selectedStatus === 'VALIDATED'}
            onClick={() => setSelectedStatus('VALIDATED')}
          />
          <label for="VALIDATED">
            <FormattedMessage {...messages.markAsValid} />
          </label>
        </p>
        <p>
          <input
            type="radio"
            value="INVALIDATED"
            className={radioInput}
            checked={selectedStatus === 'INVALIDATED'}
            onClick={() => setSelectedStatus('INVALIDATED')}
          />
          <label for="INVALIDATED">
            <FormattedMessage {...messages.markAsInvalid} />
          </label>
        </p>
      </div>
      <div className="cf">
        <h4 className="ttu blue-grey f5">
          <FormattedMessage {...messages.comment} />
        </h4>
        <p>
          <textarea onChange={e => setTaskComment(e.target.value)} rows="2" className="w-100 pa2" />
        </p>
      </div>
      <div className="cf">
        <Button className="blue-dark bg-white w-100 fl" onClick={() => stopValidation()}>
          <FormattedMessage {...messages.selectAnotherTask} />
        </Button>
      </div>
      <div className="cf mv2">
        <Button
          className="bg-red white w-100 fl"
          onClick={() => submitTask()}
          disabled={!selectedStatus}
        >
          <FormattedMessage {...messages.submitTask} />
        </Button>
      </div>
    </div>
  );
}

function CompletionInstructions() {
  const [active, setActive] = useState(true);
  return (
    <>
      <div className={active ? 'dib ph4-l w-100 cf dn-h-930' : 'dn'}>
        <h4 className="fw8 f5 blue-dark di">
          <FormattedMessage {...messages.finishMappingTitle} />
        </h4>
        <span
          className="br-100 bg-grey-light white h1 w1 fr pointer tc v-mid di"
          onClick={() => setActive(false)}
        >
          <CloseIcon className="pv1" />
        </span>
        <div className="blue-grey">
          <p>
            <CheckCircle className="bg-red white" />
            <FormattedMessage {...messages.instructionsSelect} />
          </p>
          <p>
            <CheckCircle className="bg-red white" />
            <FormattedMessage {...messages.instructionsComment} />
          </p>
          <p>
            <CheckCircle className="bg-red white" />
            <FormattedMessage {...messages.instructionsSubmit} />
          </p>
        </div>
      </div>
      <div className={active ? 'bb b--grey-light w-100' : 'dn'}></div>
    </>
  );
}

function ReopenEditor({ project, action, editor, callEditor }: Object) {
  const editorOptions = getEditors(
    action === 'MAPPING' ? project.mappingEditors : project.validationEditors,
    project.customEditor,
  );

  return (
    <div className="relative pv2">
      <span className="di pr3">
        <FormattedMessage {...messages.startAnotherEditor} />
      </span>
      <Dropdown
        options={editorOptions}
        value={
          editorOptions.map(i => i.value).includes(editor)
            ? editor
            : editorOptions.length && editorOptions[0].value
        }
        display={<FormattedMessage {...messages.startAnotherEditor} />}
        className="bg-white b--grey-light ba pa2 di"
        onChange={callEditor}
        onAdd={() => {}}
        onRemove={() => {}}
      />
    </div>
  );
}
