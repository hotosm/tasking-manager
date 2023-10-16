import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Popup from 'reactjs-popup';
import ReactTooltip from 'react-tooltip';
import { FormattedMessage } from 'react-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import messages from './messages';
import { CheckBoxInput } from '../formInputs';
import { Button, CustomButton } from '../button';
import { Dropdown } from '../dropdown';
import { CheckCircle } from '../checkCircle';
import {
  CloseIcon,
  ClipboardIcon,
  SidebarIcon,
  AlertIcon,
  QuestionCircleIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  InfoIcon,
  CommentIcon,
  PlusIcon,
} from '../svgIcons';
import { getEditors } from '../../utils/editorsList';
import { htmlFromMarkdown } from '../../utils/htmlFromMarkdown';
import { getTaskContributors } from '../../utils/getTaskContributors';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import { CommentInputField } from '../comments/commentInput';
import { useFetchLockedTasks, useClearLockedTasks } from '../../hooks/UseLockedTasks';
import {
  submitMappingTask,
  splitTask,
  stopMapping,
  stopValidation,
  submitValidationTask,
} from '../../api/projects';

export function CompletionTabForMapping({
  project,
  tasksIds,
  showReadCommentsAlert,
  disableBadImagery,
  historyTabSwitch,
  taskInstructions,
  disabled,
  contributors,
  taskComment,
  setTaskComment,
  selectedStatus,
  setSelectedStatus,
}: Object) {
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const locale = useSelector((state) => state.preferences['locale']);
  const queryClient = useQueryClient();
  const [showHelp, setShowHelp] = useState(false);
  const [showMapChangesModal, setShowMapChangesModal] = useState(false);
  const [splitTaskError, setSplitTaskError] = useState(false);
  const [redirectToPreviousProject, setRedirectToPreviousProject] = useState(true);
  const radioInput = 'radio-input input-reset pointer v-mid dib h2 w2 mr2 br-100 ba b--blue-light';
  const fetchLockedTasks = useFetchLockedTasks();
  const clearLockedTasks = useClearLockedTasks();
  const directedFrom = localStorage.getItem('lastProjectPathname');
  const { projectId } = project;

  const splitTaskMutation = useMutation({
    mutationFn: () => splitTask(projectId, tasksIds[0], token, locale),
    onSuccess: ({ data: { tasks } }) => {
      invalidateProjectData();
      clearLockedTasks();
      navigateToTasksPage(tasks.map((task) => task.taskId));
    },
    onError: (err) => {
      if (err.response?.data?.SubCode === 'SmallToSplit') {
        setSplitTaskError(true);
      } else {
        toast.error(<FormattedMessage {...messages.splitTaskGenericError} />);
      }
    },
  });

  const stopMappingMutation = useMutation({
    mutationFn: () => stopMapping(projectId, tasksIds[0], taskComment, token, locale),
    onSuccess: () => {
      invalidateProjectData();
      clearLockedTasks();
      navigateToTasksPage(tasksIds);
    },
    onError: () => {
      toast.error(<FormattedMessage {...messages.stopMappingError} />);
    },
  });

  const submitTaskMutation = useMutation({
    mutationFn: (formData) => {
      const { url, payload } = formData;
      return submitMappingTask(url, payload, token, locale);
    },
    onSuccess: () => {
      invalidateProjectData();
      fetchLockedTasks();
      navigateToTasksPage(tasksIds);
    },
    onError: () => {
      toast.error(
        <FormattedMessage {...messages.submitTaskError} values={{ numTasks: tasksIds.length }} />,
      );
    },
  });

  const onStopMapping = () => {
    if (disabled) {
      return new Promise((resolve, reject) => {
        setShowMapChangesModal('unlock');
        resolve();
      });
    }
    stopMappingMutation.mutate();
  };

  const onSplitTask = () => {
    if (disabled) {
      return new Promise((resolve, reject) => {
        setShowMapChangesModal('unlock');
        resolve();
      });
    }
    splitTaskMutation.mutate();
  };

  const onSubmitTask = () => {
    const url =
      selectedStatus === 'READY'
        ? `projects/${projectId}/tasks/actions/stop-mapping/${tasksIds[0]}/`
        : `projects/${projectId}/tasks/actions/unlock-after-mapping/${tasksIds[0]}/`;
    const payload = {
      comment: taskComment,
    };
    if (selectedStatus !== 'READY') {
      payload.status = selectedStatus;
    }
    submitTaskMutation.mutate({ url, payload });
  };

  const invalidateProjectData = () => {
    queryClient.invalidateQueries(['project-tasks', projectId]);
    queryClient.invalidateQueries(['project-activities', projectId]);
  };

  const navigateToTasksPage = (taskIds) => {
    navigate((redirectToPreviousProject && directedFrom) || `/projects/${projectId}/tasks/`, {
      state: {
        lastLockedTasksIds: taskIds,
        lastLockedProjectId: projectId,
      },
    });
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
      {splitTaskError && (
        <Popup
          modal
          open
          closeOnEscape={true}
          closeOnDocumentClick={true}
          onClose={() => setSplitTaskError(false)}
        >
          {(close) => <TaskSplitErrorModalContent close={close} />}
        </Popup>
      )}
      {showReadCommentsAlert && (
        <div
          className="tc pa2 mb1 bg-grey-light blue-dark pointer"
          role="button"
          onClick={() => historyTabSwitch()}
        >
          <InfoIcon className="v-mid h1 w1" />
          <span className="ml2 fw1 pa1">
            <FormattedMessage {...messages.readTaskComments} />
          </span>
        </div>
      )}
      <div className="cf">
        {taskInstructions && <TaskSpecificInstructions instructions={taskInstructions} />}
        <h4 className="ttu blue-grey f6 fw5">
          <FormattedMessage {...messages.editStatus} />
          <QuestionCircleIcon
            className="pointer dib v-mid pl2 pb1 blue-light"
            height="1.25rem"
            role="button"
            aria-label="toggle help"
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
            onChange={() => setSelectedStatus('MAPPED')}
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
            onChange={() => setSelectedStatus('READY')}
          />
          <label htmlFor="READY">
            <FormattedMessage {...messages.incomplete} />
          </label>
        </p>
        {!disableBadImagery && (
          <p>
            <input
              id="BADIMAGERY"
              type="radio"
              value="BADIMAGERY"
              className={radioInput}
              checked={selectedStatus === 'BADIMAGERY'}
              onChange={() => setSelectedStatus('BADIMAGERY')}
            />
            <label htmlFor="BADIMAGERY">
              <FormattedMessage {...messages.badImagery} />
            </label>
          </p>
        )}
      </div>
      <div className="cf">
        <h4 className="ttu blue-grey f6 fw5">
          <FormattedMessage {...messages.comment} />
        </h4>
        <p>
          <CommentInputField
            comment={taskComment}
            setComment={setTaskComment}
            contributors={contributors}
            enableHashtagPaste={true}
            enableContributorsHashtag
            isShowTabNavs
          />
        </p>
      </div>
      {directedFrom && (
        <div className="flex items-center">
          <CheckBoxInput
            changeState={() => setRedirectToPreviousProject(!redirectToPreviousProject)}
            isActive={redirectToPreviousProject}
          />
          <label>
            <FormattedMessage
              {...messages.redirectToPreviousProject}
              values={{
                projectId: directedFrom.split('/')[2],
              }}
            />
          </label>
        </div>
      )}
      <div className="cf mv2" data-tip>
        <Button
          className="bg-red white w-100 fl"
          onClick={onSubmitTask}
          disabled={
            disabled ||
            !selectedStatus ||
            [stopMappingMutation.status, splitTaskMutation.status].includes('loading')
          }
          loading={submitTaskMutation.status === 'loading'}
        >
          <FormattedMessage {...messages.submitTask} />
        </Button>
      </div>
      {disabled && (
        <ReactTooltip place="top">
          <FormattedMessage {...messages.unsavedChangesTooltip} />
        </ReactTooltip>
      )}
      <div className="cf pb1">
        <Button
          className="bg-blue-dark white w-50 fl"
          onClick={onSplitTask}
          loading={splitTaskMutation.status === 'loading'}
          disabled={[submitTaskMutation.status, splitTaskMutation.status].includes('loading')}
        >
          <FormattedMessage {...messages.splitTask} />
        </Button>
        <Button
          className="blue-dark bg-white w-50 fl"
          onClick={onStopMapping}
          loading={stopMappingMutation.status === 'loading'}
          disabled={[submitTaskMutation.status, splitTaskMutation.status].includes('loading')}
        >
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
  contributors,
  validationStatus,
  setValidationStatus,
  validationComments,
  setValidationComments,
}: Object) {
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const locale = useSelector((state) => state.preferences.locale);
  const queryClient = useQueryClient();
  const [showMapChangesModal, setShowMapChangesModal] = useState(false);
  const [redirectToPreviousProject, setRedirectToPreviousProject] = useState(true);
  const fetchLockedTasks = useFetchLockedTasks();
  const clearLockedTasks = useClearLockedTasks();
  const directedFrom = localStorage.getItem('lastProjectPathname');
  const { projectId } = project;

  const stopValidationMutation = useMutation({
    mutationFn: (formData) => stopValidation(projectId, formData, token, locale),
    onSuccess: () => {
      clearLockedTasks();
      invalidateProjectData();
      navigateToTasksPage();
    },
    onError: () => {
      toast.error(<FormattedMessage {...messages.stopValidationError} />);
    },
  });

  const submitTaskMutation = useMutation({
    mutationFn: (formData) => submitValidationTask(projectId, formData, token, locale),
    onSuccess: () => {
      fetchLockedTasks();
      invalidateProjectData();
      navigateToTasksPage(true);
    },
    onError: () => {
      toast.error(
        <FormattedMessage {...messages.submitTaskError} values={{ numTasks: tasksIds.length }} />,
      );
    },
  });

  const updateStatus = (id, newStatus) =>
    setValidationStatus({ ...validationStatus, [id]: newStatus });

  const updateComment = (id, newComment) =>
    setValidationComments({ ...validationComments, [id]: newComment });

  const copyCommentToTasks = (id, statusFilter) => {
    const comment = validationComments[id];
    let tasks = tasksIds.filter((task) => task !== id);
    if (statusFilter) {
      tasks = tasks.filter((task) => validationStatus[task] === statusFilter);
    }
    let payload = {};
    tasks.forEach((task) => (payload[task] = comment));
    setValidationComments({ ...validationComments, ...payload });
  };

  const areAllTasksVerified = Object.keys(validationStatus).length === tasksIds.length;

  const onStopValidation = () => {
    if (disabled) {
      return new Promise((resolve, reject) => {
        setShowMapChangesModal('unlock');
        resolve();
      });
    }
    const payload = {
      resetTasks: tasksIds.map((taskId) => ({
        taskId: taskId,
        comment: validationComments[taskId],
      })),
    };
    stopValidationMutation.mutate(payload);
  };

  const onSubmitTask = () => {
    const payload = {
      validatedTasks: tasksIds.map((taskId) => ({
        taskId: taskId,
        comment: validationComments[taskId],
        status: validationStatus[taskId],
      })),
    };
    submitTaskMutation.mutate(payload);
  };

  const navigateToTasksPage = (applyFilter = false) => {
    let filterParam = '';
    if (applyFilter) {
      filterParam = '?filter=MAPPED';
    }
    navigate(
      (redirectToPreviousProject && directedFrom) || `/projects/${projectId}/tasks/${filterParam}`,
      {
        state: {
          lastLockedTasksIds: tasksIds,
          lastLockedProjectId: projectId,
        },
      },
    );
  };

  const invalidateProjectData = () => {
    queryClient.invalidateQueries(['project-tasks', projectId]);
    queryClient.invalidateQueries(['project-activities', projectId]);
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
        <p className="b mb2">
          <FormattedMessage {...messages.validatedQuestion} values={{ number: tasksIds.length }} />
        </p>
        {tasksIds.length > 3 && (
          <div className="cf w-100 db pt1 pv2 blue-dark mb2 bb b--light-gray">
            <div className="cf w-100">
              <div className="fw8 f5 w-10 dib">
                <FormattedMessage {...messages.filterAll} />
              </div>
              <div className="w-auto dib">
                {['VALIDATED', 'INVALIDATED'].map((value, index) => (
                  <div className="dib" key={index}>
                    <input
                      type="radio"
                      id={value}
                      value={value}
                      className="radio-input input-reset pointer v-mid dib h2 w2 mr2 ml3 br-100 ba b--blue-light"
                      checked={
                        Object.values(validationStatus).every((status) => status === value) &&
                        Object.values(validationStatus).length === tasksIds.length
                      }
                      onChange={() => {
                        let tempObj = {};
                        tasksIds.forEach((id) => (tempObj = { ...tempObj, [id]: value }));
                        setValidationStatus(tempObj);
                      }}
                    />
                    <label htmlFor={value}>
                      {index ? (
                        <FormattedMessage {...messages.incomplete} />
                      ) : (
                        <FormattedMessage {...messages.complete} />
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {tasksIds.map((id) => (
          <TaskValidationSelector
            key={id}
            id={id}
            projectId={projectId}
            contributors={contributors}
            currentStatus={validationStatus[id]}
            updateStatus={updateStatus}
            comment={validationComments[id]}
            updateComment={updateComment}
            copyCommentToTasks={copyCommentToTasks}
            isValidatingMultipleTasks={tasksIds.length > 1}
          />
        ))}
      </div>
      {directedFrom && (
        <div className="flex items-center">
          <CheckBoxInput
            changeState={() => setRedirectToPreviousProject(!redirectToPreviousProject)}
            isActive={redirectToPreviousProject}
          />
          <label>
            <FormattedMessage
              {...messages.redirectToPreviousProject}
              values={{
                projectId: directedFrom.split('/')[2],
              }}
            />
          </label>
        </div>
      )}
      <div className="cf mv3" data-tip>
        <Button
          className="bg-red white w-100 fl"
          onClick={onSubmitTask}
          disabled={disabled || !areAllTasksVerified || stopValidationMutation.status === 'loading'}
          loading={submitTaskMutation.status === 'loading'}
        >
          <FormattedMessage {...messages[tasksIds.length > 1 ? 'submitTasks' : 'submitTask']} />
        </Button>
      </div>
      {disabled && (
        <ReactTooltip place="top">
          <FormattedMessage {...messages.unsavedChangesTooltip} />
        </ReactTooltip>
      )}
      <div className="cf">
        <Button
          className="blue-dark bg-white w-100 fl"
          onClick={onStopValidation}
          loading={stopValidationMutation.status === 'loading'}
          disabled={submitTaskMutation.status === 'loading'}
        >
          <FormattedMessage {...messages.stopValidation} />
        </Button>
      </div>
      <div className="bb b--grey-light w-100 pv2"></div>
    </div>
  );
}

const TaskValidationSelector = ({
  id,
  projectId,
  currentStatus,
  comment,
  updateComment,
  contributors,
  updateStatus,
  copyCommentToTasks,
  isValidatingMultipleTasks,
}) => {
  const userDetails = useSelector((state) => state.auth.userDetails);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [enableCopy, setEnableCopy] = useState(false);
  const setComment = (newComment) => updateComment(id, newComment);
  const [contributorsList, setContributorsList] = useState([]);

  // the contributors is filled only on the case of single task validation,
  // so we need to fetch the task history in the case of multiple task validation
  useEffect(() => {
    if (showCommentInput && isValidatingMultipleTasks && !contributors.length) {
      fetchLocalJSONAPI(`projects/${projectId}/tasks/${id}/`).then((response) =>
        setContributorsList(getTaskContributors(response.taskHistory, userDetails.username)),
      );
    }
  }, [
    isValidatingMultipleTasks,
    showCommentInput,
    contributors,
    id,
    projectId,
    userDetails.username,
  ]);

  return (
    <div className="cf w-100 db pt1 pv2 blue-dark">
      <div className="cf w-100">
        <div className="fw8 f5 w-10 dib">#{id}</div>
        <div className="w-auto dib">
          <input
            type="radio"
            value="VALIDATED"
            id={`#${id}-VALIDATED`}
            className="radio-input input-reset pointer v-mid dib h2 w2 mr2 ml3 br-100 ba b--blue-light"
            checked={currentStatus === 'VALIDATED'}
            onChange={() => updateStatus(id, 'VALIDATED')}
          />
          <label htmlFor={`#${id}-VALIDATED`}>
            <FormattedMessage {...messages.complete} />
          </label>
          <input
            type="radio"
            value="INVALIDATED"
            id={`#${id}-INVALIDATED`}
            className="radio-input input-reset pointer v-mid dib h2 w2 mr2 ml3 br-100 ba b--blue-light"
            checked={currentStatus === 'INVALIDATED'}
            onChange={() => updateStatus(id, 'INVALIDATED')}
          />
          <label htmlFor={`#${id}-INVALIDATED`}>
            <FormattedMessage {...messages.incomplete} />
          </label>
          <CustomButton
            className={`${
              showCommentInput ? 'b--red red' : 'b--grey-light blue-dark'
            } bg-white ba br1 ml3 pv2 ph3`}
            onClick={() => setShowCommentInput(!showCommentInput)}
            icon={
              comment ? (
                <CommentIcon className="h1 w1 v-mid" />
              ) : (
                <PlusIcon className="h1 w1 v-mid" />
              )
            }
          >
            <FormattedMessage {...messages.comment} />
          </CustomButton>
        </div>
      </div>
      {showCommentInput && (
        <>
          <div className="cf w-100 db pt2">
            <CommentInputField
              comment={comment}
              setComment={setComment}
              contributors={contributors.length ? contributors : contributorsList}
              enableHashtagPaste
              enableContributorsHashtag
              isShowTabNavs
            />
          </div>
          {isValidatingMultipleTasks && comment && (
            <div className="fw5 tr bb b--grey-light bw1 pb2">
              {enableCopy ? (
                <>
                  <CustomButton
                    className="bg-white ba b--grey-light blue-dark br1 ml1 pv2 ph2 mb1"
                    onClick={() => {
                      copyCommentToTasks(id);
                      setEnableCopy(false);
                    }}
                  >
                    <FormattedMessage {...messages.copyCommentToAll} />
                  </CustomButton>
                  {currentStatus && (
                    <CustomButton
                      className="bg-white ba b--grey-light blue-dark br1 ml1 pv2 ph2 mb1"
                      onClick={() => {
                        copyCommentToTasks(id, currentStatus);
                        setEnableCopy(false);
                      }}
                    >
                      <FormattedMessage {...messages[`copyCommentTo${currentStatus}`]} />
                    </CustomButton>
                  )}
                  <CustomButton
                    className="red bn bg-white br1 ml2 ph2 pv2"
                    onClick={() => setEnableCopy(false)}
                  >
                    <FormattedMessage {...messages.cancel} />
                  </CustomButton>
                </>
              ) : (
                <CustomButton
                  className="bg-white ba b--grey-light blue-dark br1 ml1 pv2 ph3"
                  onClick={() => setEnableCopy(true)}
                >
                  <ClipboardIcon className="h1 w1 v-top pr1" />
                  <FormattedMessage {...messages.copyComment} />
                </CustomButton>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

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
        <CloseIcon className="pv1" aria-label="hide instructions" />
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
        toTop={true}
      />
    </div>
  );
}

export function SidebarToggle({ setShowSidebar, activeEditor }: Object) {
  const iDContext = useSelector((state) => state.editor.context);

  return (
    <div>
      <FormattedMessage {...messages.hideSidebar}>
        {(msg) => (
          <div className="fr pointer" title={msg}>
            <SidebarIcon
              role="button"
              aria-label="Hide sidebar"
              onClick={() => {
                setShowSidebar(false);
                activeEditor === 'ID' && iDContext.ui().restart();
              }}
            />
          </div>
        )}
      </FormattedMessage>
    </div>
  );
}

export function UnsavedMapChangesModalContent({ close, action }: Object) {
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
        {action === 'reload editor' && (
          <FormattedMessage {...messages.unsavedChangesToReloadEditor} />
        )}
      </div>
      <Button className="bg-red white" onClick={() => close()}>
        <FormattedMessage {...messages.closeModal} />
      </Button>
    </div>
  );
}

function TaskSplitErrorModalContent({ close }: Object) {
  return (
    <div className="blue-dark bg-white pv2 pv4-ns ph2 ph4-ns tc">
      <div className="cf tc orange pb3">
        <AlertIcon height="50px" width="50px" />
      </div>
      <h3 className="barlow-condensed f3 fw6 mv0">
        <FormattedMessage {...messages.splitTaskError} />
      </h3>
      <div className="mv4 lh-title">
        <FormattedMessage {...messages.splitTaskErrorDescription} />
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
      <h4
        className="ttu blue-grey mt1 mb0 pointer"
        role="button"
        onClick={() => setIsOpen(!isOpen)}
      >
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
