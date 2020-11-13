import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { navigate } from '@reach/router';

import messages from './messages';
import { Button } from '../button';
import { createProject } from '../../store/actions/project';
import { store } from '../../store';
import { pushToLocalJSONAPI } from '../../network/genericJSONRequest';

const handleCreate = (metadata, updateMetadata, projectName, token, cloneProjectData, setError) => {
  if (!metadata.geom) {
    setError('Area of interest not provided');
    return;
  }

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
  pushToLocalJSONAPI('projects/', JSON.stringify(projectParams), token)
    .then((res) => navigate(`/manage/projects/${res.projectId}`))
    .catch((e) => setError(e));
};

export default function Review({ metadata, updateMetadata, token, projectId, cloneProjectData }) {
  const [error, setError] = useState(null);
  const projectName = metadata.projectName;

  const setProjectName = (event) => {
    event.preventDefault();
    updateMetadata({ ...metadata, projectName: event.target.value });
  };

  return (
    <>
      <h3 className="f3 fw6 mt2 mb3 barlow-condensed blue-dark">
        <FormattedMessage {...messages.step4} />
      </h3>
      <p className="pt2">
        <FormattedMessage {...messages.reviewTaskNumberMessage} values={{ n: metadata.tasksNo }} />
      </p>

      {cloneProjectData.name === null ? (
        <>
          <label for="name" className="f5 fw6 db mb2 pt3">
            <FormattedMessage {...messages.name} />
          </label>
          <input
            onChange={setProjectName}
            id="name"
            className="input-reset ba b--black-20 pa2 mb2 db w-75"
            type="text"
          />
        </>
      ) : null}

      <div className="mt4">
        <Button
          onClick={() =>
            handleCreate(metadata, updateMetadata, projectName, token, cloneProjectData, setError)
          }
          className="white bg-red"
        >
          {cloneProjectData.name === null ? (
            <FormattedMessage {...messages.create} />
          ) : (
            <FormattedMessage {...messages.clone} />
          )}
        </Button>
      </div>
      {error && (
        <div className="mt3">
          <FormattedMessage {...messages.creationFailed} values={{ error: error }} />
        </div>
      )}
    </>
  );
}
