import React, { useState, useLayoutEffect } from 'react';
import { Redirect, navigate } from '@reach/router';
import { useSelector } from 'react-redux';

import { DescriptionForm } from '../components/projectEdit/descriptionForm';
import { InstructionsForm } from '../components/projectEdit/instructionsForm';
import { MetadataForm } from '../components/projectEdit/metadataForm';
import { PriorityAreasForm } from '../components/projectEdit/priorityAreasForm';
import { ImageryForm } from '../components/projectEdit/imageryForm';
import { PermissionsForm } from '../components/projectEdit/permissionsForm';
import { SettingsForm } from '../components/projectEdit/settingsForm';
import { ActionsForm } from '../components/projectEdit/actionsForm';
import { Button } from '../components/button';
import { API_URL } from '../config';

export const StateContext = React.createContext();

export const styleClasses = {
  divClass: 'w-70 pb5 mb4 bb b--grey-light',
  labelClass: 'f4 barlow-condensed db mb3',
  pClass: 'db mb3 f5',
  inputClass: 'w-80 pa2 db mb2',
  numRows: '4',
  buttonClass: 'bg-blue-dark dib white',
  modalTitleClass: 'f3 barlow-condensed pb3 bb',
  drawButtonClass: 'bg-blue-dark ttu white mr2',
  deleteButtonClass: 'bg-red ttu white',
  modalClass: 'w-40 vh-50 center pv5',
  actionClass: 'bg-blue-dark white dib mr2 mt2 pointer',
};

export const handleCheckButton = (event, arrayElement) => {
  if (event.target.checked === true) {
    arrayElement.push(event.target.value);
  } else {
    arrayElement = arrayElement.filter(t => t !== event.target.value);
  }

  return arrayElement;
};

export function ProjectEdit({ id }) {
  const token = useSelector(state => state.auth.get('token'));
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [languages, setLanguages] = useState(null);
  const [option, setOption] = useState('description');
  const [projectInfo, setProjectInfo] = useState({
    mappingTypes: [],
    mappingEditors: [],
    validationEditors: [],
    projectTeams: [],
    projectInfoLocales: [
      {
        locale: '',
        name: '',
        shortDescription: '',
        description: '',
        instructions: '',
        perTaskInstructions: '',
      },
    ],
  });

  useLayoutEffect(() => {
    async function getSupportedLanguages() {
      const res = await fetch(`${API_URL}system/languages/`);
      let resp_json = await res.json();
      setLanguages(resp_json.supportedLanguages);
    }
    getSupportedLanguages();
  }, []);

  useLayoutEffect(() => {
    async function fetchData() {
      const res = await fetch(`${API_URL}projects/${id}/`);
      let resp_json = await res.json();
      const array = [resp_json.projectInfo];
      resp_json = { ...resp_json, projectInfoLocales: array };
      setProjectInfo(resp_json);
    }

    fetchData();
  }, [id]);

  if (!token) {
    return <Redirect to={'login'} noThrow />;
  }

  const renderList = () => {
    const checkSelected = optionSelected => {
      let liClass = 'w-90 link barlow-condensed f4 pv2 pointer';
      if (option === optionSelected) {
        liClass = liClass.concat(' bg-grey-light');
      }
      return liClass;
    };

    const elements = [
      { item: 'description', showItem: 'Description *' },
      { item: 'instructions', showItem: 'Instructions *' },
      { item: 'metadata', showItem: 'Metadata *' },
      { item: 'priority_areas', showItem: 'Priority areas' },
      { item: 'imagery', showItem: 'Imagery' },
      { item: 'permissions', showItem: 'Permissions' },
      { item: 'settings', showItem: 'Settings' },
      { item: 'actions', showItem: 'Actions' },
    ];

    return (
      <div>
        <ul className="list pl0 mt0">
          {elements.map(elm => (
            <li className={checkSelected(elm.item)} onClick={() => setOption(elm.item)}>
              {elm.showItem}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderForm = option => {
    switch (option) {
      case 'description':
        return <DescriptionForm languages={languages} />;
      case 'instructions':
        return <InstructionsForm languages={languages} />;
      case 'metadata':
        return <MetadataForm />;
      case 'imagery':
        return <ImageryForm />;
      case 'permissions':
        return <PermissionsForm />;
      case 'settings':
        return <SettingsForm languages={languages} defaultLocale={projectInfo.defaultLocale} />;
      case 'priority_areas':
        return <PriorityAreasForm />;
      case 'actions':
        return <ActionsForm projectId={projectInfo.projectId} token={token} />;
      default:
        return null;
    }
  };

  const saveChanges = () => {
    const updateProject = async () => {
      const url = `${API_URL}projects/${id}/`;
      const headers = {
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
        Authorization: `Token ${token}`,
      };

      const options = {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify(projectInfo),
      };

      const res = await fetch(url, options);
      if (res.status !== 200) {
        setError(true);
      } else {
        setSuccess(true);
      }
    };

    updateProject();
  };

  return (
    <div className="cf pv3 ph4 bg-tan">
      <h2 className="ml6 pb2 f2 fw6 mt2 mb3 ttu barlow-condensed blue-dark">Edit project</h2>
      <div className="fl vh-75-l w-30 ml6">
        {renderList()}
        <Button onClick={saveChanges} className="bg-red white">
          Save
        </Button>
        <Button onClick={() => navigate(`/projects/${id}`)} className="bg-white blue-dark ml2">
          Go to project page
        </Button>
        <p className="pt2">
          {success && (
            <span className="blue-dark bg-grey-light pa2">Project updated successfully</span>
          )}
          {error && <span className="bg-red white pa2">Project update failed: {error}</span>}
        </p>
      </div>
      <StateContext.Provider value={{ projectInfo: projectInfo, setProjectInfo: setProjectInfo }}>
        <div className="fl w-60">{renderForm(option)}</div>
      </StateContext.Provider>
    </div>
  );
}
