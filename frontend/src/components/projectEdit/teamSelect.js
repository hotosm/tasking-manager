import React, { useState, useContext, useEffect } from 'react';
import { Button } from '../../components/button';
import Select from 'react-select';
import { StateContext } from '../../views/projectEdit';
import { PencilIcon, WasteIcon } from '../svgIcons';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';

export const TeamSelect = () => {
  const nullState = {
    team: { name: null, teamId: null },
    role: { value: null, label: null },
    edit: false,
  };

  const { projectInfo, setProjectInfo } = useContext(StateContext);
  const [orgs, setOrgs] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamSelect, setTeamSelect] = useState(nullState);
  const [org, setOrg] = useState(null);

  useEffect(() => {
    fetchLocalJSONAPI('organisations/', null).then(r => setOrgs(r.organisations));
    fetchLocalJSONAPI('teams/', null).then(t => setTeams(t.teams));
  }, []);

  const teamRoles = [
    { value: 'MAPPER', label: 'Mapper' },
    { value: 'VALIDATOR', label: 'Validator' },
    { value: 'PROJECT_MANAGER', label: 'Project Manager' },
  ];

  const getLabel = value => {
    return teamRoles.filter(r => r.value === value)[0].label;
  };

  const editTeam = id => {
    const team = projectInfo.projectTeams.filter(t => t.teamId === id)[0];
    const role = teamRoles.filter(r => team.role === r.value)[0];

    setTeamSelect(t => {
      return { ...t, edit: true, team: team, role: role };
    });
  };

  const removeTeam = id => {
    const teams = projectInfo.projectTeams.filter(t => t.teamId !== id);
    setProjectInfo({ ...projectInfo, projectTeams: teams });
  };

  const newTeam = () => {
    return {
      teamId: teamSelect.team.teamId,
      name: teamSelect.team.name,
      role: teamSelect.role.value,
    };
  };

  const addTeam = () => {
    const teams = projectInfo.projectTeams;
    teams.push(newTeam());
    setProjectInfo({ ...projectInfo, projectTeams: teams });
    setTeamSelect(nullState);
  };

  const updateTeam = () => {
    const teams = projectInfo.projectTeams.map(t => {
      let item = t;
      if (t.teamId === teamSelect.team.teamId) {
        item = newTeam();
      }
      return item;
    });
    setProjectInfo({ ...projectInfo, projectTeams: teams });
    setTeamSelect(nullState);
  };

  const handleSelect = (value, field) => {
    setTeamSelect(v => {
      return { ...v, [field]: value };
    });
  };

  // Get only ids.
  const teamsIds = projectInfo.projectTeams.map(t => {
    return t.teamId;
  });

  let filteredTeams = teams.filter(t => !teamsIds.includes(t.teamId));

  if (org !== null) {
    filteredTeams = [
      {
        label: org.name,
        options: filteredTeams.filter(t => t.organisationId === org.organisationId),
      },
      {
        label: 'Others',
        options: filteredTeams.filter(t => t.organisationId !== org.organisationId),
      },
    ];
  }

  return (
    <div className="w-80">
      <div className="mb4">
        {projectInfo.projectTeams.map(t => {
          return (
            <div className="w-100 cf pa2 bg-white blue-dark mb2">
              <div className="w-50 fl fw5">{t.name}</div>
              <div className="w-30 fl">{getLabel(t.role)}</div>
              <div className="w-20 fl pl3 tr">
                <span
                  className="pa2 br-100 pointer bg-grey-light"
                  onClick={() => editTeam(t.teamId)}
                >
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
          );
        })}
      </div>
      <Select
        isClearable={true}
        getOptionLabel={option => option.name}
        getOptionValue={option => option.organisationId}
        placeholder="Filter teams by organisations"
        options={orgs}
        value={org}
        onChange={value => setOrg(value)}
        className="mb2"
      />
      <div className="cf pb3 flex justify-between">
        <Select
          getOptionLabel={option => option.name}
          getOptionValue={option => option.teamId}
          options={filteredTeams}
          onChange={value => handleSelect(value, 'team')}
          className="w-40 fl pr2"
          value={teamSelect.team.name !== null ? teamSelect.team : null}
          placeholder={'Select a team...'}
          isDisabled={teamSelect.edit}
        />
        <Select
          getOptionLabel={option => option.label}
          getOptionValue={option => option.value}
          options={teamRoles}
          onChange={value => handleSelect(value, 'role')}
          className="w-40 fl mr2"
          isDisabled={teamSelect.team.name === null ? true : false}
          value={teamSelect.role.value !== null ? teamSelect.role : null}
          placeholder={'Select a role...'}
        />
        <Button
          onClick={teamSelect.edit === false ? addTeam : updateTeam}
          className="bg-blue-dark white fl mr2 f7"
          disabled={teamSelect.team.name === null || teamSelect.role.value === null}
        >
          {teamSelect.edit === false ? 'Add' : 'Update'}
        </Button>
        <Button
          onClick={() => setTeamSelect(nullState)}
          className="bg-red white fl mr2 f7"
          disabled={!teamSelect.edit}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};
