import React from 'react';
import { createProject } from '../../store/actions/project';
import { store } from '../../store';
import { API_URL } from '../../config';

const handleCreate = (metadata, updateMetadata, projectName, token) => {
  updateMetadata({ ...metadata, projectName: projectName });
  store.dispatch(createProject(metadata));

  const projectParams = {
    areaOfInterest: metadata.geom,
    projectName: metadata.projectName,
    tasks: metadata.taskGrid,
    arbitraryTasks: metadata.arbitraryTasks,
  };

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

export default function Review({ metadata, updateMetadata, token }) {
  const projectName = metadata.projectName;

  const setProjectName = event => {
    event.preventDefault();
    updateMetadata({ ...metadata, projectName: event.target.value });
  };
  const buttonStyle = 'mt2 f5 ph4-l pv2-l white bg-blue-dark';

  return (
    <>
      <h3 className="f3 fw6 mt2 mb3 barlow-condensed blue-dark">Step 5: Review</h3>
      <div>
        <p>Project has {metadata.tasksNo} task(s)</p>

        <label for="name" className="f6 b db mb2">
          Name
        </label>
        <input
          onChange={setProjectName}
          id="name"
          className="input-reset ba b--black-20 pa2 mb2 db w-50"
          type="text"
        />
        <button
          type="button"
          onClick={() => handleCreate(metadata, updateMetadata, projectName, token)}
          className={buttonStyle}
        >
          Create
        </button>
      </div>
    </>
  );
}
