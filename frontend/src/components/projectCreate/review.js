import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { Button } from '../button';
import { createProject } from '../../store/actions/project';
import { store } from '../../store';
import { API_URL } from '../../config';

const handleCreate = (metadata, updateMetadata, projectName, token, cloneProjectData) => {
  updateMetadata({ ...metadata, projectName: projectName });
  store.dispatch(createProject(metadata));

  let projectParams = {
    areaOfInterest: metadata.geom,
    projectName: metadata.projectName,
    tasks: metadata.taskGrid,
    arbitraryTasks: metadata.arbitraryTasks,
  };

  if (cloneProjectData.name !== null) {
    projectParams.projectName = '';
    projectParams.cloneFromProjectId = cloneProjectData.id;
  }

  const url = `${API_URL}projects/`;
  const reqParams = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Token ${token}` : '',
    },
    body: JSON.stringify(projectParams),
  };
  fetch(url, reqParams);
};

export default function Review({ metadata, updateMetadata, token, projectId, cloneProjectData }) {
  const projectName = metadata.projectName;

  const setProjectName = event => {
    event.preventDefault();
    updateMetadata({ ...metadata, projectName: event.target.value });
  };

  return (
    <>
      <h3 className="f3 fw6 mt2 mb3 barlow-condensed blue-dark">
        <FormattedMessage {...messages.step3} />
      </h3>
      <p className="pt2">
        <FormattedMessage {...messages.reviewTaskNumberMessage} values={{ n: metadata.tasksNo }} />
      </p>

      {cloneProjectData.name === null ? (
        <>
          <label for="name" className="f4 b db mb2 pt3">
            <FormattedMessage {...messages.name} />
          </label>
          <input
            onChange={setProjectName}
            id="name"
            className="input-reset ba b--black-20 pa2 mb2 db w-50"
            type="text"
          />
        </>
      ) : null}

      <div className="mt2">
        <Button
          onClick={() =>
            handleCreate(metadata, updateMetadata, projectName, token, cloneProjectData)
          }
          className="white bg-blue-dark"
        >
          {cloneProjectData.name === null ? (
            <FormattedMessage {...messages.create} />
          ) : (
            <FormattedMessage {...messages.clone} />
          )}
        </Button>
      </div>
    </>
  );
}
