import React, { useState, useContext } from 'react';
import Select from 'react-select';
import { FormattedMessage, useIntl } from 'react-intl';

import messages from './messages';
import commonMessages from '../messages';
import { Button } from '../../components/button';
import { StateContext } from '../../views/projectEdit';
import { PencilIcon, WasteIcon, ExternalLinkIcon } from '../svgIcons';
import { useFetchWithAbort } from '../../hooks/UseFetch';

export const TeamSelect = () => {
  const intl = useIntl();
  const nullState = {
    team: { name: null, teamId: null },
    role: { value: null, label: null },
    edit: false,
  };

  const { projectInfo, setProjectInfo } = useContext(StateContext);
  const [teamSelect, setTeamSelect] = useState(nullState);
  const [org, setOrg] = useState(null);

  const [, isOrganisationsLoading, organisationsData] = useFetchWithAbort(
    'organisations/?omitManagerList=true',
  );
  const [, isTeamsLoading, teamsData] = useFetchWithAbort('teams/?omitMemberList=true');

  const teamRoles = [
    { value: 'MAPPER', label: 'Mapper' },
    { value: 'VALIDATOR', label: 'Validator' },
    { value: 'PROJECT_MANAGER', label: 'Project Manager' },
  ];

  const getLabel = (value) => {
    return teamRoles.filter((r) => r.value === value)[0].label;
  };

  const editTeam = (id) => {
    const team = projectInfo.teams.filter((t) => t.teamId === id)[0];
    const role = teamRoles.filter((r) => team.role === r.value)[0];

    setTeamSelect((t) => {
      return { ...t, edit: true, team: team, role: role };
    });
  };

  const removeTeam = (id) => {
    const teams = projectInfo.teams.filter((t) => t.teamId !== id);
    setProjectInfo({ ...projectInfo, teams: teams });
  };

  const newTeam = () => {
    return {
      teamId: teamSelect.team.teamId,
      name: teamSelect.team.name,
      role: teamSelect.role.value,
    };
  };

  const addTeam = () => {
    const teams = projectInfo.teams;
    teams.push(newTeam());
    setProjectInfo({ ...projectInfo, teams: teams });
    setTeamSelect(nullState);
  };

  const updateTeam = () => {
    const teams = projectInfo.teams.map((t) => {
      let item = t;
      if (t.teamId === teamSelect.team.teamId) {
        item = newTeam();
      }
      return item;
    });
    setProjectInfo({ ...projectInfo, teams: teams });
    setTeamSelect(nullState);
  };

  const handleSelect = (value, field) => {
    setTeamSelect((v) => {
      return { ...v, [field]: value };
    });
  };

  // Get only ids.
  const teamsIds = projectInfo.teams.map((t) => {
    return t.teamId;
  });

  let filteredTeams = teamsData?.teams?.filter((t) => !teamsIds.includes(t.teamId));

  if (org !== null) {
    filteredTeams = [
      {
        label: org.name,
        options: filteredTeams?.filter((t) => t.organisationId === org.organisationId),
      },
      {
        label: 'Others',
        options: filteredTeams?.filter((t) => t.organisationId !== org.organisationId),
      },
    ];
  }

  return (
    <div className="w-80">
      <div className="mb4">
        {projectInfo.teams.map((t) => (
          <div key={t.teamId} className="w-100 cf pa2 bg-white blue-dark mb2">
            <div className="w-50 fl fw5">
              <span className="pr1">{t.name}</span>
              <a
                className="link blue-light"
                href={`/teams/${t.teamId}/membership/`}
                target="_blank"
                rel="noreferrer noopener"
              >
                <ExternalLinkIcon />
              </a>
            </div>
            <div className="w-30 fl">{getLabel(t.role)}</div>
            <div className="w-20 fl pl3 tr">
              <span className="pa2 br-100 pointer bg-grey-light" onClick={() => editTeam(t.teamId)}>
                <PencilIcon className="h1 w1 blue-dark" />
              </span>
              <span
                className=" ml1 pa2 br-100 pointer bg-grey-light red"
                onClick={() => removeTeam(t.teamId)}
              >
                <WasteIcon className="h1 w1" />
              </span>
            </div>
          </div>
        ))}
      </div>
      <Select
        classNamePrefix="react-select"
        isClearable={true}
        getOptionLabel={(option) => option.name}
        getOptionValue={(option) => option.organisationId}
        placeholder={<FormattedMessage {...messages.filterByOrg} />}
        options={isOrganisationsLoading ? [] : organisationsData.organisations}
        value={org}
        onChange={(value) => setOrg(value)}
        className="mb2 z-4"
        isLoading={isOrganisationsLoading}
        loadingMessage={() => intl.formatMessage(commonMessages['loading'])}
      />
      <div className="cf pb3 flex justify-between">
        <Select
          classNamePrefix="react-select"
          getOptionLabel={(option) => option.name}
          getOptionValue={(option) => option.teamId}
          options={isTeamsLoading ? [] : filteredTeams}
          onChange={(value) => handleSelect(value, 'team')}
          className="w-40 fl pr2 z-3"
          value={teamSelect.team.name !== null ? teamSelect.team : null}
          placeholder={<FormattedMessage {...messages.selectTeam} />}
          isDisabled={teamSelect.edit}
          isLoading={isTeamsLoading}
          loadingMessage={() => intl.formatMessage(commonMessages['loading'])}
        />
        <Select
          classNamePrefix="react-select"
          getOptionLabel={(option) => option.label}
          getOptionValue={(option) => option.value}
          options={teamRoles}
          onChange={(value) => handleSelect(value, 'role')}
          className="w-40 fl mr2 z-3"
          isDisabled={teamSelect.team.name === null ? true : false}
          value={teamSelect.role.value !== null ? teamSelect.role : null}
          placeholder={<FormattedMessage {...messages.selectRole} />}
        />
        <Button
          onClick={teamSelect.edit === false ? addTeam : updateTeam}
          className="bg-blue-dark white fl mr2 f6"
          disabled={teamSelect.team.name === null || teamSelect.role.value === null}
        >
          {teamSelect.edit === false ? (
            <FormattedMessage {...messages.add} />
          ) : (
            <FormattedMessage {...messages.update} />
          )}
        </Button>
        <Button
          onClick={() => setTeamSelect(nullState)}
          className="bg-red white fl mr2 f6"
          disabled={!teamSelect.edit}
        >
          <FormattedMessage {...messages.cancel} />
        </Button>
      </div>
    </div>
  );
};
