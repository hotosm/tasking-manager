import { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { Alert } from '../alert';

import { OrganisationSelect } from '../formInputs';

export default function Review({ metadata, updateMetadata, token, projectId, cloneProjectData }) {
  const [error, setError] = useState(null);

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
        <FormattedMessage
          {...messages.reviewTaskNumberMessage}
          values={{ n: metadata.tasksNumber }}
        />
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

      {error && (
        <Alert type="error">
          <FormattedMessage {...messages.creationFailed} values={{ error: error }} />
        </Alert>
      )}
    </>
  );
}
