import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { FormattedMessage, useIntl } from 'react-intl';
import AsyncSelect from 'react-select/async';
import { toast } from 'react-hot-toast';

import messages from './messages';
import { Button } from '../button';
import { Alert } from '../alert';
import { CheckBoxInput } from '../formInputs';
import { UserSearchSelect } from '../user/userSearchSelect';
import { assignTasks, unassignTasks } from '../../api/projects';
import api from '../../api/apiClient';

const radioClasses = 'radio-input input-reset pointer v-mid dib h2 w2 mr2 br-100 ba b--blue-light';
const tabClasses = 'pointer bn bg-transparent f5 pb2 mr4 ph0';

export const getAssignmentErrorSubCode = (error) =>
  error?.response?.data?.SubCode || error?.response?.data?.error?.sub_code || null;

function StageRadios({ name, options, value, onChange }) {
  return (
    <div role="radiogroup">
      {options.map((option) => (
        <label className="dib pr4 pv1" key={option}>
          <input
            type="radio"
            name={name}
            value={option}
            checked={value === option}
            onChange={() => onChange(option)}
            className={radioClasses}
          />
          <FormattedMessage {...messages[`stage_${option}`]} />
        </label>
      ))}
    </div>
  );
}

// Thin vertical line between two adjacent action buttons
export const ButtonDivider = () => (
  <span className="dib bl b--grey-light h2 mh3 mb1" aria-hidden="true" />
);

/**
 * Footer used instead of the mapping/validation footer while a project manager is
 * assigning tasks: selection shortcuts on the left, actions for the selection on the right.
 */
export function AssignModeFooter({
  selectedTasks,
  hasPriorityAreas,
  onSelectPriorityAreas,
  onSelectUnassigned,
  onClearSelection,
  onAssign,
  onUnassign,
  onExit,
}) {
  const number = selectedTasks.length;
  const shortcutClasses = 'bg-white blue-dark ba b--grey-light f6 mr2 mb1';
  return (
    <div className="cf bg-white pb2 ph4-l ph2">
      <div className="w-60-ns w-100 fl">
        <h3 className="db ttu f7 blue-grey mb2 fw5">
          <FormattedMessage {...messages.assignTasksMode} />
        </h3>
        <p className="blue-grey f6 mt0 mb2">
          <FormattedMessage {...messages.assignModeHint} />
        </p>
        <div>
          {hasPriorityAreas && (
            <Button className={shortcutClasses} onClick={onSelectPriorityAreas}>
              <FormattedMessage {...messages.selectTasksInPriorityAreas} />
            </Button>
          )}
          <Button className={shortcutClasses} onClick={onSelectUnassigned}>
            <FormattedMessage {...messages.selectUnassignedTasks} />
          </Button>
          <Button className={shortcutClasses} onClick={onClearSelection} disabled={!number}>
            <FormattedMessage {...messages.clearSelection} />
          </Button>
        </div>
      </div>
      <div className="w-40-ns w-100 fl">
        <div className="mt3 flex flex-wrap justify-end items-center">
          <span className="blue-dark mr3 mb1">
            <FormattedMessage {...messages.selectedTasksCount} values={{ number }} />
          </span>
          <Button
            className="bg-white blue-dark ba b--grey-light mr2 mb1"
            onClick={onUnassign}
            disabled={!number}
          >
            <FormattedMessage {...messages.unassignSelectedTasks} values={{ number }} />
          </Button>
          <Button className="white bg-red fw5 mb1" onClick={onAssign} disabled={!number}>
            <FormattedMessage {...messages.assignSelectedTasks} values={{ number }} />
          </Button>
          <ButtonDivider />
          <Button className="white bg-red fw5 mb1" onClick={onExit}>
            <FormattedMessage {...messages.exitAssignMode} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function TeamSearchSelect({ projectTeams, value, onChange }) {
  const intl = useIntl();
  const token = useSelector((state) => state.auth.token);

  const projectTeamOptions = useMemo(() => {
    const seen = new Set();
    return (projectTeams || [])
      .filter((team) => (seen.has(team.teamId) ? false : seen.add(team.teamId)))
      .map((team) => ({ teamId: team.teamId, name: team.name }));
  }, [projectTeams]);

  const loadOptions = (inputValue) =>
    api(token)
      .get('teams/', {
        params: { team_name: inputValue, omitMemberList: true, paginate: true, perPage: 20 },
      })
      .then((res) => {
        const projectTeamIds = projectTeamOptions.map((team) => team.teamId);
        const teams = (res.data.teams || []).map((team) => ({
          teamId: team.teamId,
          name: team.name,
        }));
        return [
          {
            label: intl.formatMessage(messages.projectTeams),
            options: teams.filter((team) => projectTeamIds.includes(team.teamId)),
          },
          {
            label: intl.formatMessage(messages.otherTeams),
            options: teams.filter((team) => !projectTeamIds.includes(team.teamId)),
          },
        ].filter((group) => group.options.length);
      })
      .catch(() => []);

  return (
    <AsyncSelect
      classNamePrefix="react-select"
      inputId="assign-team-select"
      cacheOptions
      defaultOptions={
        projectTeamOptions.length
          ? [{ label: intl.formatMessage(messages.projectTeams), options: projectTeamOptions }]
          : true
      }
      loadOptions={loadOptions}
      getOptionLabel={(option) => option.name}
      getOptionValue={(option) => String(option.teamId)}
      placeholder={intl.formatMessage(messages.searchTeams)}
      noOptionsMessage={() => intl.formatMessage(messages.noOptions)}
      value={value}
      onChange={onChange}
    />
  );
}

export function AssignTasksModal({ project, taskIds, close, onSuccess }) {
  const intl = useIntl();
  const token = useSelector((state) => state.auth.token);
  const locale = useSelector((state) => state.preferences.locale);
  const [assigneeType, setAssigneeType] = useState('USER');
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(null);
  const [stage, setStage] = useState('MAPPING');
  const [notify, setNotify] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);
  const [warnings, setWarnings] = useState(null);

  const number = taskIds.length;
  const assignee = assigneeType === 'USER' ? user : team;

  const submit = () => {
    if (!assignee) return;
    const payload = { taskIds, stage, notify };
    if (assigneeType === 'USER') {
      payload.userId = user.id;
    } else {
      payload.teamId = team.teamId;
    }
    setIsPending(true);
    setError(null);
    assignTasks(project.projectId, payload, token, locale)
      .then((res) => {
        setIsPending(false);
        onSuccess && onSuccess();
        const responseWarnings = res.data?.warnings || [];
        if (responseWarnings.length) {
          setWarnings(responseWarnings);
        } else {
          toast.success(
            intl.formatMessage(messages.assignSuccess, { number: res.data?.assigned ?? number }),
          );
          close();
        }
      })
      .catch((e) => {
        setIsPending(false);
        setError(getAssignmentErrorSubCode(e) || 'generic');
      });
  };

  if (warnings) {
    return (
      <div className="blue-dark bg-white pv2 pv4-ns ph2 ph4-ns">
        <h3 className="barlow-condensed f3 fw6 mv0">
          <FormattedMessage {...messages.assignWarningsTitle} />
        </h3>
        <ul className="mv4 lh-title pl3">
          {warnings.map((warning) => (
            <li key={warning.subCode} className="mb2">
              {messages[`warning_${warning.subCode}`] ? (
                <FormattedMessage {...messages[`warning_${warning.subCode}`]} />
              ) : (
                warning.message
              )}
            </li>
          ))}
        </ul>
        <div className="tr">
          <Button className="bg-red white" onClick={close}>
            <FormattedMessage {...messages.done} />
          </Button>
        </div>
      </div>
    );
  }

  const errorMessage = error && (messages[`assignError_${error}`] || messages.assignErrorGeneric);

  return (
    <div className="blue-dark bg-white pv2 pv4-ns ph2 ph4-ns">
      <h3 className="barlow-condensed f3 fw6 mv0">
        <FormattedMessage {...messages.assignSelectedTasks} values={{ number }} />
      </h3>
      <div className="mt3 bb b--grey-light" role="tablist">
        {['USER', 'TEAM'].map((type) => (
          <button
            key={type}
            role="tab"
            aria-selected={assigneeType === type}
            className={`${tabClasses} ${
              assigneeType === type ? 'bb bw1 b--red blue-dark fw6' : 'blue-grey'
            }`}
            onClick={() => setAssigneeType(type)}
          >
            <FormattedMessage {...messages[type === 'USER' ? 'assignToUser' : 'assignToTeam']} />
          </button>
        ))}
      </div>
      <div className="mt3">
        {assigneeType === 'USER' ? (
          <UserSearchSelect
            inputId="assign-user-select"
            autoFocus
            placeholder={intl.formatMessage(messages.searchUsers)}
            noOptionsMessage={({ inputValue }) =>
              inputValue ? intl.formatMessage(messages.noOptions) : null
            }
            value={user}
            onChange={setUser}
          />
        ) : (
          <TeamSearchSelect projectTeams={project.teams} value={team} onChange={setTeam} />
        )}
      </div>
      <div className="mt3">
        <p className="fw6 mv2">
          <FormattedMessage {...messages.assignStage} />
        </p>
        <StageRadios
          name="assign-stage"
          options={['MAPPING', 'VALIDATION']}
          value={stage}
          onChange={setStage}
        />
      </div>
      <div className="mt3 flex items-center">
        <CheckBoxInput isActive={notify} changeState={() => setNotify(!notify)} />
        <span className="pl2 f6">
          <FormattedMessage {...messages.notifyAssignees} />
        </span>
      </div>
      {errorMessage && (
        <div className="mt3">
          <Alert type="error" compact>
            <FormattedMessage {...errorMessage} />
          </Alert>
        </div>
      )}
      <div className="mt4 tr">
        <Button className="bg-white blue-dark mr2" onClick={close}>
          <FormattedMessage {...messages.cancel} />
        </Button>
        <Button className="bg-red white" onClick={submit} disabled={!assignee} loading={isPending}>
          <FormattedMessage {...messages.assign} />
        </Button>
      </div>
    </div>
  );
}

export function UnassignTasksModal({ project, taskIds, close, onSuccess }) {
  const intl = useIntl();
  const token = useSelector((state) => state.auth.token);
  const locale = useSelector((state) => state.preferences.locale);
  const [stage, setStage] = useState('BOTH');
  const [isPending, setIsPending] = useState(false);
  const [hasError, setHasError] = useState(false);
  const number = taskIds.length;

  const submit = () => {
    const payload = { taskIds };
    if (stage !== 'BOTH') payload.stage = stage;
    setIsPending(true);
    setHasError(false);
    unassignTasks(project.projectId, payload, token, locale)
      .then((res) => {
        setIsPending(false);
        onSuccess && onSuccess();
        toast.success(
          intl.formatMessage(messages.unassignSuccess, { number: res.data?.unassigned ?? 0 }),
        );
        close();
      })
      .catch(() => {
        setIsPending(false);
        setHasError(true);
      });
  };

  return (
    <div className="blue-dark bg-white pv2 pv4-ns ph2 ph4-ns">
      <h3 className="barlow-condensed f3 fw6 mv0">
        <FormattedMessage {...messages.unassignTitle} values={{ number }} />
      </h3>
      <p className="mt3 mb2">
        <FormattedMessage {...messages.unassignDescription} />
      </p>
      <StageRadios
        name="unassign-stage"
        options={['BOTH', 'MAPPING', 'VALIDATION']}
        value={stage}
        onChange={setStage}
      />
      {hasError && (
        <div className="mt3">
          <Alert type="error" compact>
            <FormattedMessage {...messages.unassignError} />
          </Alert>
        </div>
      )}
      <div className="mt4 tr">
        <Button className="bg-white blue-dark mr2" onClick={close}>
          <FormattedMessage {...messages.cancel} />
        </Button>
        <Button className="bg-red white" onClick={submit} loading={isPending}>
          <FormattedMessage {...messages.unassign} />
        </Button>
      </div>
    </div>
  );
}
