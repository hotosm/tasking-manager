import React, { useState, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { navigate } from '@reach/router';

import messages from './messages';
import { Button } from '../button';
import { AlertMessage } from './alertMessage';
import { createProject } from '../../store/actions/project';
import { store } from '../../store';
import { pushToLocalJSONAPI } from '../../network/genericJSONRequest';
import { OrganisationSelect } from '../formInputs';

export default function Review({ metadata, updateMetadata, token, projectId, cloneProjectData }) {
  const [error, setError] = useState(null);
  const intl = useIntl();

  const handleCreate = useCallback(
    (metadata, token, cloneProjectData, setError) => {
      if (!metadata.geom) {
        setError(intl.formatMessage(messages.noGeometry));
        return;
      }
      if (!metadata.organisation && !cloneProjectData.organisation) {
        setError(intl.formatMessage(messages.noOrganization));
        return;
      }

      store.dispatch(createProject(metadata));
      let projectParams = {
        areaOfInterest: metadata.geom,
        projectName: metadata.projectName,
        organisation: metadata.organisation || cloneProjectData.organisation,
        tasks: metadata.taskGrid,
        arbitraryTasks: metadata.arbitraryTasks,
      };

      if (cloneProjectData.name !== null) {
        projectParams.projectName = '';
        projectParams.cloneFromProjectId = cloneProjectData.id;
      }
      pushToLocalJSONAPI('projects/', JSON.stringify(projectParams), token)
        .then((res) => navigate(`/manage/projects/${res.projectId}`))
        .catch((e) => setError(e.Error));
    },
    [intl],
  );

  const setProjectName = (event) => {
    event.preventDefault();
    updateMetadata({ ...metadata, projectName: event.target.value });
  };

  return (
    <>
      <h3 className="f3 ttu fw6 mt2 mb3 barlow-condensed blue-dark">
        <FormattedMessage {...messages.step4} />
      </h3>
      <p className="pt2">
        <FormattedMessage {...messages.reviewTaskNumberMessage} values={{ n: metadata.tasksNo }} />
      </p>

      {cloneProjectData.name === null ? (
        <>
          <label htmlFor="name" className="f5 fw6 db mb2 pt3">
            <FormattedMessage {...messages.name} />
          </label>
          <input
            onChange={setProjectName}
            id="name"
            className="input-reset ba b--black-20 pa2 mb2 db w-100"
            type="text"
          />
        </>
      ) : null}

      {cloneProjectData.organisation === null ? (
        <>
          <label className="f5 fw6 db mb2 pt3">
            <FormattedMessage {...messages.organization} />
          </label>
          <OrganisationSelect
            orgId={metadata.organisation}
            onChange={(value) => {
              setError(null);
              updateMetadata({ ...metadata, organisation: value.organisationId || '' });
            }}
            className="z-5 w-75"
          />
        </>
      ) : null}

      <div className="mt4">
        <Button
          onClick={() => handleCreate(metadata, token, cloneProjectData, setError)}
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
        <div className="mt3 red">
          <AlertMessage
            error={{
              error: true,
              message: <FormattedMessage {...messages.creationFailed} values={{ error: error }} />,
            }}
          />
        </div>
      )}
    </>
  );
}
