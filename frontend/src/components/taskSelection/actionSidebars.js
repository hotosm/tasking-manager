import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { navigate } from '@reach/router';
import Popup from 'reactjs-popup';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { Button } from '../button';
import { Dropdown } from '../dropdown';
import { CheckCircle } from '../checkCircle';
import {
  CloseIcon,
  SidebarIcon,
  AlertIcon,
  QuestionCircleIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from '../svgIcons';
import { getEditors } from '../../utils/editorsList';
import { htmlFromMarkdown } from '../../utils/htmlFromMarkdown';
import { pushToLocalJSONAPI, fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import { CommentInputField } from '../comments/commentInput';
import { useFetchLockedTasks, useClearLockedTasks } from '../../hooks/UseLockedTasks';

export function CompletionTabForMapping({
  project,
  tasksIds,
  taskInstructions,
  disabled,
  taskComment,
  setTaskComment,
  selectedStatus,
  setSelectedStatus,
}: Object) {
  const token = useSelector((state) => state.auth.get('token'));
  const [showHelp, setShowHelp] = useState(false);
  const [showMapChangesModal, setShowMapChangesModal] = useState(false);
  const radioInput = 'radio-input input-reset pointer v-mid dib h2 w2 mr2 br-100 ba b--blue-light';
  const fetchLockedTasks = useFetchLockedTasks();
  const clearLockedTasks = useClearLockedTasks();

  const splitTask = () => {
    if (!disabled) {
      fetchLocalJSONAPI(
        `projects/${project.projectId}/tasks/actions/split/${tasksIds[0]}/`,
        token,
        'POST',
      ).then((r) => {
        clearLockedTasks();
        navigate(`../tasks/`);
      });
    } else {
      setShowMapChangesModal('split');
    }
  };

  const stopMapping = () => {
    if (!disabled) {
      pushToLocalJSONAPI(
        `projects/${project.projectId}/tasks/actions/stop-mapping/${tasksIds[0]}/`,
        JSON.stringify({ comment: taskComment }),
        token,
      ).then((r) => {
        clearLockedTasks();
        navigate(`/projects/${project.projectId}/tasks/`);
      });
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
        url = `projects/${project.projectId}/tasks/actions/unlock-after-mapping/${tasksIds[0]}/`;
        payload.status = 'BADIMAGERY';
      }
      pushToLocalJSONAPI(url, JSON.stringify(payload), token).then((r) => {
        fetchLockedTasks();
        navigate(`/projects/${project.projectId}/tasks/`);
      });
    }
  };

  return (
    <div>
      {disabled && showMapChangesModal && (
        <Popup
          modal
          open
          closeOnEscape={true}
          closeOnDocumentClick={true}
          onClose={() => setShowMapChangesModal(null)}
        >
          {(close) => <UnsavedMapChangesModalContent close={close} action={showMapChangesModal} />}
        </Popup>
      )}
      <div className="cf">
        {taskInstructions && <TaskSpecificInstructions instructions={taskInstructions} />}
        <h4 className="ttu blue-grey f5">
          <FormattedMessage {...messages.editStatus} />
          <QuestionCircleIcon
            className="pointer dib v-mid pl2 pb1 blue-light"
            height="1.25rem"
            onClick={() => setShowHelp(!showHelp)}
          />
        </h4>
        {showHelp && (
          <div className="cf">
            <CompletionInstructions setVisibility={setShowHelp} />
          </div>
        )}
        <p className="b">
          <FormattedMessage {...messages.mappedQuestion} />
        </p>
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
            <FormattedMessage {...messages.complete} />
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
          <CommentInputField
            comment={taskComment}
            setComment={setTaskComment}
            enableHashtagPaste={true}
          />
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
      <div className="cf pb1">
        <Button className="bg-blue-dark white w-50 fl" onClick={() => splitTask()}>
          <FormattedMessage {...messages.splitTask} />
        </Button>
        <Button className="blue-dark bg-white w-50 fl" onClick={() => stopMapping()}>
          <FormattedMessage {...messages.selectAnotherTask} />
        </Button>
      </div>
      <div className="bb b--grey-light w-100 pv2"></div>
    </div>
  );
}

export function CompletionTabForValidation({
  project,
  tasksIds,
  taskInstructions,
  disabled,
  taskComment,
  setTaskComment,
  selectedStatus,
  setSelectedStatus,
}: Object) {
  const token = useSelector((state) => state.auth.get('token'));
  const [showMapChangesModal, setShowMapChangesModal] = useState(false);
  const fetchLockedTasks = useFetchLockedTasks();
  const clearLockedTasks = useClearLockedTasks();
  const radioInput = 'radio-input input-reset pointer v-mid dib h2 w2 mr2 br-100 ba b--blue-light';

  const stopValidation = () => {
    if (!disabled) {
      pushToLocalJSONAPI(
        `projects/${project.projectId}/tasks/actions/stop-validation/`,
        JSON.stringify({
          resetTasks: tasksIds.map((taskId) => ({ taskId: taskId, comment: taskComment })),
        }),
        token,
      ).then((r) => {
        clearLockedTasks();
        navigate(`../tasks/`);
      });
    } else {
      setShowMapChangesModal('unlock');
    }
  };

  const submitTask = () => {
    if (!disabled && selectedStatus) {
      let url;
      let payload = {
        validatedTasks: tasksIds.map((taskId) => ({
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
      pushToLocalJSONAPI(url, JSON.stringify(payload), token).then((r) => {
        fetchLockedTasks();
        navigate(`../tasks/?filter=readyToValidate`);
      });
    }
  };

  return (
    <div>
      {disabled && showMapChangesModal && (
        <Popup
          modal
          open
          closeOnEscape={true}
          closeOnDocumentClick={true}
          onClose={() => setShowMapChangesModal(null)}
        >
          {(close) => <UnsavedMapChangesModalContent close={close} action={showMapChangesModal} />}
        </Popup>
      )}
      <div className="cf">
        {taskInstructions && (
          <TaskSpecificInstructions instructions={taskInstructions} open={false} />
        )}
        <h4 className="ttu blue-grey f5">
          <FormattedMessage {...messages.editStatus} />
        </h4>
        <p className="b">
          <FormattedMessage {...messages.validatedQuestion} />
        </p>
        <p>
          <input
            type="radio"
            value="VALIDATED"
            className={radioInput}
            checked={selectedStatus === 'VALIDATED'}
            onClick={() => setSelectedStatus('VALIDATED')}
          />
          <label for="VALIDATED">
            <FormattedMessage {...messages.complete} />
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
            <FormattedMessage {...messages.incomplete} />
          </label>
        </p>
      </div>
      <div className="cf">
        <h4 className="ttu blue-grey f5">
          <FormattedMessage {...messages.comment} />
        </h4>
        <p>
          <CommentInputField
            comment={taskComment}
            setComment={setTaskComment}
            enableHashtagPaste={true}
          />
        </p>
      </div>
      <div className="cf mb3">
        <Button
          className="bg-red white w-100 fl"
          onClick={() => submitTask()}
          disabled={disabled || !selectedStatus}
        >
          <FormattedMessage {...messages[tasksIds.length > 1 ? 'submitTasks' : 'submitTask']} />
        </Button>
      </div>
      <div className="cf">
        <Button className="blue-dark bg-white w-100 fl" onClick={() => stopValidation()}>
          <FormattedMessage {...messages.stopValidation} />
        </Button>
      </div>
      <div className="bb b--grey-light w-100 pv2"></div>
    </div>
  );
}

function CompletionInstructions({ setVisibility }: Object) {
  return (
    <div className="dib ph4-l w-100 cf">
      <h4 className="fw8 f5 blue-dark di">
        <FormattedMessage {...messages.finishMappingTitle} />
      </h4>
      <span
        className="br-100 bg-grey-light white h1 w1 fr pointer tc v-mid di"
        onClick={() => setVisibility(false)}
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
  );
}

export function ReopenEditor({ project, action, editor, callEditor }: Object) {
  const editorOptions = getEditors(
    action === 'MAPPING' ? project.mappingEditors : project.validationEditors,
    project.customEditor,
  );

  return (
    <div className="dib w-50 fl tc pt3 pb2 pr3">
      <span className="db pb2 ttu blue-grey f6 fw5">
        <FormattedMessage {...messages.reloadEditor} />
      </span>
      <Dropdown
        options={editorOptions}
        value={
          editorOptions.map((i) => i.value).includes(editor)
            ? editor
            : editorOptions.length && editorOptions[0].value
        }
        display={<FormattedMessage {...messages.reloadEditor} />}
        className="bg-white b--grey-light ba pa2 di"
        onChange={callEditor}
        onAdd={() => {}}
        onRemove={() => {}}
        toTop={true}
      />
    </div>
  );
}

export function SidebarToggle({ setShowSidebar }: Object) {
  const iDContext = useSelector((state) => state.editor.context);
  return (
    <div>
      <FormattedMessage {...messages.hideSidebar}>
        {(msg) => (
          <div className="fr pointer" title={msg}>
            <SidebarIcon
              onClick={() => {
                setShowSidebar(false);
                iDContext.ui().restart();
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

function TaskSpecificInstructions({ instructions, open = true }: Object) {
  const [isOpen, setIsOpen] = useState(open);
  return (
    <>
      <h4 className="ttu blue-grey mt1 mb0 pointer" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? (
          <ChevronDownIcon style={{ height: '14px' }} className="pr1 pb1 v-mid" />
        ) : (
          <ChevronRightIcon style={{ height: '14px' }} className="pr1 pb1 v-mid" />
        )}
        <FormattedMessage {...messages.taskExtraInfo} />
      </h4>
      {isOpen && (
        <div
          className="markdown-content"
          dangerouslySetInnerHTML={htmlFromMarkdown(instructions)}
        />
      )}
    </>
  );
}
