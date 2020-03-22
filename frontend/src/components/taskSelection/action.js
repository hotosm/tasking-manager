import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { navigate } from '@reach/router';
import ReactPlaceholder from 'react-placeholder';
import Popup from 'reactjs-popup';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { ProjectInstructions } from './instructions';
import { TasksMap } from './map';
import { HeaderLine } from '../projectDetail/header';
import { Button } from '../button';
import { Dropdown } from '../dropdown';
import { CheckCircle } from '../checkCircle';
import { CloseIcon, SidebarIcon, AlertIcon } from '../svgIcons';
import { getEditors } from '../../utils/editorsList';
import { openEditor } from '../../utils/openEditor';
import { pushToLocalJSONAPI, fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import { TaskHistory } from './taskActivity';

const Editor = React.lazy(() => import('../editor'));

export function TaskMapAction({ project, projectIsReady, tasks, activeTasks, action, editor }) {
  const userDetails = useSelector(state => state.auth.get('userDetails'));
  const [activeSection, setActiveSection] = useState('completion');
  const [activeEditor, setActiveEditor] = useState(editor);
  const [showSidebar, setShowSidebar] = useState(true);
  const tasksIds = activeTasks ? activeTasks.map(task => task.taskId) : [];
  const [editorRef, setEditorRef] = useState(null);
  const [disabled, setDisable] = useState(false);

  useEffect(() => {
    if (!editor && projectIsReady && userDetails.defaultEditor && tasks && tasksIds) {
      let editorToUse;
      if (action === 'MAPPING') {
        editorToUse = project.mappingEditors.includes(userDetails.defaultEditor)
          ? [userDetails.defaultEditor]
          : project.mappingEditors;
      } else {
        editorToUse = project.validationEditors.includes(userDetails.defaultEditor)
          ? [userDetails.defaultEditor]
          : project.validationEditors;
      }
      const url = openEditor(editorToUse[0], project, tasks, tasksIds, [
        window.innerWidth,
        window.innerHeight,
      ]);
      if (url) {
        navigate(`./${url}`);
      } else {
        navigate(`./?editor=${editorToUse[0]}`);
      }
    }
  }, [editor, project, projectIsReady, userDetails.defaultEditor, action, tasks, tasksIds]);

  const callEditor = arr => {
    setActiveEditor(arr[0].value);
    const url = openEditor(arr[0].value, project, tasks, tasksIds, [
      window.innerWidth,
      window.innerHeight,
    ]);
    if (url) {
      navigate(`./${url}`);
    } else {
      navigate(`./?editor=${arr[0].value}`);
    }
  };

  return (
    <div className="cf vh-minus-122-ns overflow-y-hidden">
      <div className={`fl h-100 relative ${showSidebar ? 'w-70' : 'w-100-minus-4rem'}`}>
        {editor === 'ID' ? (
          <React.Suspense fallback={<div className={`w7 h5 center`}>Loading iD...</div>}>
            <Editor editorRef={editorRef} setEditorRef={setEditorRef} setDisable={setDisable} />
          </React.Suspense>
        ) : (
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
              selected={tasksIds}
            />
          </ReactPlaceholder>
        )}
      </div>
      {showSidebar ? (
        <div className="w-30 fr pt3 ph3 h-100 overflow-y-scroll">
          <ReactPlaceholder
            showLoadingAnimation={true}
            rows={3}
            ready={typeof project.projectId === 'number' && project.projectId > 0}
          >
            {activeEditor === 'ID' && (
              <SidebarToggle setShowSidebar={setShowSidebar} editorRef={editorRef} />
            )}
            <HeaderLine author={project.author} projectId={project.projectId} />
            <div className="cf pb3">
              <h3 className="f2 fw6 mt2 mb3 ttu barlow-condensed blue-dark">
                {project.projectInfo && project.projectInfo.name}
                <span className="pl2">&#183;</span>
                {tasksIds.map((task, n) => (
                  <span key={n} className="red ph2">{`#${task}`}</span>
                ))}
              </h3>
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
                  <CompletionTabForMapping
                    project={project}
                    tasksIds={tasksIds}
                    disabled={disabled}
                  />
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
                  <CompletionTabForValidation
                    project={project}
                    tasksIds={tasksIds}
                    disabled={disabled}
                  />
                </>
              )}
              {activeSection === 'instructions' && (
                <ProjectInstructions
                  instructions={project.projectInfo && project.projectInfo.instructions}
                />
              )}
              {activeSection === 'history' && (
                <TaskHistory projectId={project.projectId} taskId={tasksIds[0]} />
              )}
            </div>
          </ReactPlaceholder>
        </div>
      ) : (
        <div className="w-3 cf tc mt3 ph1 pl2 pr1 pointer">
          <FormattedMessage {...messages.showSidebar}>
            {msg => (
              <div className="db" title={msg}>
                <SidebarIcon onClick={() => setShowSidebar(true)} />
              </div>
            )}
          </FormattedMessage>
          <div className="db">
            <h3 className="blue-dark">#{project.projectId}</h3>
            <div>
              {tasksIds.map((task, n) => (
                <span key={n} className="red fw5 db pb2">{`#${task}`}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CompletionTabForMapping({ project, tasksIds, disabled }: Object) {
  const token = useSelector(state => state.auth.get('token'));
  const [selectedStatus, setSelectedStatus] = useState();
  const [taskComment, setTaskComment] = useState('');
  const [showMapChangesModal, setShowMapChangesModal] = useState(false);
  const radioInput = 'radio-input input-reset pointer v-mid dib h2 w2 mr2 br-100 ba b--blue-light';

  const splitTask = () => {
    if (!disabled) {
      fetchLocalJSONAPI(
        `projects/${project.projectId}/tasks/actions/split/${tasksIds[0]}/`,
        token,
        'POST',
      ).then(r => navigate(`../tasks/`));
    } else {
      setShowMapChangesModal('split');
    }
  };

  const stopMapping = () => {
    if (!disabled) {
      pushToLocalJSONAPI(
        `projects/${project.projectId}/tasks/actions/stop-mapping/${tasksIds[0]}/`,
        '{}',
        token,
      ).then(r => navigate(`/projects/${project.projectId}/tasks/`));
    } else {
      setShowMapChangesModal('unlock');
    }
  };

  const submitTask = () => {
    if (!disabled && selectedStatus) {
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
      {disabled && showMapChangesModal &&
        <Popup
          modal
          open
          closeOnEscape={true}
          closeOnDocumentClick={true}
          onClose={() => setShowMapChangesModal(null)}
        >
          {close =>
            <UnsavedMapChangesModalContent
              close={close}
              action={showMapChangesModal}
            />
          }
        </Popup>
      }
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
      <div className="cf mv2">
        <Button
          className="bg-red white w-100 fl"
          onClick={() => submitTask()}
          disabled={disabled || !selectedStatus}
        >
          <FormattedMessage {...messages.submitTask} />
        </Button>
      </div>
      <div className="cf">
        <Button className="bg-blue-dark white w-50 fl" onClick={() => splitTask()}>
          <FormattedMessage {...messages.splitTask} />
        </Button>
        <Button className="blue-dark bg-white w-50 fl" onClick={() => stopMapping()}>
          <FormattedMessage {...messages.selectAnotherTask} />
        </Button>
      </div>
    </div>
  );
}

function CompletionTabForValidation({ project, tasksIds, disabled }: Object) {
  const token = useSelector(state => state.auth.get('token'));
  const [selectedStatus, setSelectedStatus] = useState();
  const [taskComment, setTaskComment] = useState('');
  const [showMapChangesModal, setShowMapChangesModal] = useState(false);
  const radioInput = 'radio-input input-reset pointer v-mid dib h2 w2 mr2 br-100 ba b--blue-light';

  const stopValidation = () => {
    if (!disabled) {
      pushToLocalJSONAPI(
        `projects/${project.projectId}/tasks/actions/stop-validation/`,
        JSON.stringify({
          resetTasks: tasksIds.map(taskId => ({ taskId: taskId, comment: taskComment })),
        }),
        token,
      ).then(r => navigate(`../tasks/`));
    } else {
      setShowMapChangesModal('unlock');
    }
  };

  const submitTask = () => {
    if (!disabled && selectedStatus) {
      let url;
      let payload = {
        validatedTasks: tasksIds.map(taskId => ({
          taskId: taskId,
          comment: taskComment,
          status: selectedStatus,
        })),
      };
      if (selectedStatus === 'VALIDATED') {
        url = `projects/${project.projectId}/tasks/actions/unlock-after-validation/`;
      }
      if (selectedStatus === 'INVALIDATED') {
        url = `projects/${project.projectId}/tasks/actions/unlock-after-validation/`;
      }
      pushToLocalJSONAPI(url, JSON.stringify(payload), token).then(r => navigate(`../tasks/`));
    }
  };

  return (
    <div>
      {disabled && showMapChangesModal &&
        <Popup
          modal
          open
          closeOnEscape={true}
          closeOnDocumentClick={true}
          onClose={() => setShowMapChangesModal(null)}
        >
          {close =>
            <UnsavedMapChangesModalContent
              close={close}
              action={showMapChangesModal}
            />
          }
        </Popup>
      }
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
      <div className="cf mb3">
        <Button
          className="bg-red white w-100 fl"
          onClick={() => submitTask()}
          disabled={disabled || !selectedStatus}
        >
          <FormattedMessage {...messages[tasksIds.length > 0 ? 'submitTasks' : 'submitTask']} />
        </Button>
      </div>
      <div className="cf">
        <Button className="blue-dark bg-white w-100 fl" onClick={() => stopValidation()}>
          <FormattedMessage {...messages.selectAnotherTask} />
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
        <FormattedMessage {...messages.reloadEditor} />
      </span>
      <Dropdown
        options={editorOptions}
        value={
          editorOptions.map(i => i.value).includes(editor)
            ? editor
            : editorOptions.length && editorOptions[0].value
        }
        display={<FormattedMessage {...messages.reloadEditor} />}
        className="bg-white b--grey-light ba pa2 di"
        onChange={callEditor}
        onAdd={() => {}}
        onRemove={() => {}}
      />
    </div>
  );
}

function SidebarToggle({ setShowSidebar, editorRef }: Object) {
  return (
    <div>
      <FormattedMessage {...messages.hideSidebar}>
        {msg => (
          <div className="fr pointer" title={msg}>
            <SidebarIcon
              onClick={() => {
                setShowSidebar(false);
                editorRef.ui().restart();
              }}
            />
          </div>
        )}
      </FormattedMessage>
    </div>
  );
}

function UnsavedMapChangesModalContent({ close, action }: Object) {
  return (
    <div className="blue-dark bg-white pv2 pv4-ns ph2 ph4-ns tc">
      <div className="cf tc red pb3">
        <AlertIcon height="50px" width="50px" />
      </div>
      <h3 className="barlow-condensed f3 fw6 mv0">
        <FormattedMessage {...messages.unsavedChanges} />
      </h3>
      <div className="mv4 lh-title">
        {action === 'split' && <FormattedMessage {...messages.unsavedChangesToSplit} />}
        {action === 'unlock' && <FormattedMessage {...messages.unsavedChangesToUnlock} />}
      </div>
      <Button className="bg-red white" onClick={() => close()}>
        <FormattedMessage {...messages.closeModal} />
      </Button>
    </div>
  );
}
