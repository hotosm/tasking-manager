import React, { useState, useLayoutEffect } from 'react';
import { useSelector } from 'react-redux';
import { DescriptionForm } from '../components/projectEdit/descriptionForm';
import { InstructionsForm } from '../components/projectEdit/instructionsForm';
import { MetadataForm } from '../components/projectEdit/metadataForm';
import { PriorityAreasForm } from '../components/projectEdit/priorityAreasForm';
import { ImageryForm } from '../components/projectEdit/imageryForm';
import { PermissionsForm } from '../components/projectEdit/permissionsForm';
import { SettingsForm } from '../components/projectEdit/settingsForm';
import { ActionsForm } from '../components/projectEdit/actionsForm';

import { Redirect } from '@reach/router';
import { API_URL } from '../config';
import { navigate } from '@reach/router';
const buttonClass = 'f6 link dim ph3 pv2 mb2 dib white';

export const StateContext = React.createContext();

export const styleClasses = {
  divClass: 'w-70 pb5 mb4 bb b--light-silver',
  labelClass: 'f4 barlow-condensed db mb3',
  pClass: 'db mb3 f5',
  inputClass: 'w-80',
  numRows: '4',
  buttonClass: 'f6 link dim ph3 pv2 mb2 dib white',
  modalTitleClass: 'f3 barlow-condensed pb3 bb',
  drawButtonClass: buttonClass.concat(' bg-navy ttu'),
  deleteButtonClass: buttonClass.concat(' bg-gray ttu'),
  modalClass: 'w-40 vh-50 center pv5',
  actionClass: 'f6 bg-gray white ttu dim ph3 pv2 link dib mr2',
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
  const [option, setOption] = useState('description');
  const [projectInfo, setProjectInfo] = useState({
    mappingTypes: [],
    mappingEditors: [],
    validationEditors: [],
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
        liClass = liClass.concat(' bg-light-gray');
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
        <p className="ma0 fw2 ttu f7"> In this area </p>
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
        return <DescriptionForm />;
      case 'instructions':
        return <InstructionsForm />;
      case 'metadata':
        return <MetadataForm />;
      case 'imagery':
        return <ImageryForm />;
      case 'permissions':
        return <PermissionsForm />;
      case 'settings':
        return <SettingsForm />;
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
      await fetch(`${API_URL}projects/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(projectInfo),
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Token ${token}` : '',
        },
      });
    };
    updateProject();
  };

  return (
    <div style={{ backgroundColor: '#f7f7f7' }} className="cf pv3 ph4">
      <h2 className="ml6 pb2 f2 fw6 mt2 mb3 ttu barlow-condensed blue-dark">Edit project</h2>
      <div className="fl vh-75-l w-30 ml6">
        {renderList()}
        <button onClick={saveChanges} className={styleClasses.drawButtonClass}>
          save
        </button>

        <button
          onClick={() => navigate(`/projects/${id}`)}
          className={styleClasses.deleteButtonClass}
        >
          go to project
        </button>
      </div>
      <StateContext.Provider value={{ projectInfo: projectInfo, setProjectInfo: setProjectInfo }}>
        <div className="fl w-60">{renderForm(option)}</div>
      </StateContext.Provider>
    </div>
  );
}
