import { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { Alert } from '../alert';

import { OrganisationSelect } from '../formInputs';
import { DEFAULT_SANDBOX_DB } from '../../config';

const databaseOptions = [
  { value: 'OSM', label: 'OSM' },
  { value: 'sandbox', label: 'Sandbox' },
];

const SANDBOX_DB = DEFAULT_SANDBOX_DB;

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

      <>
        <label className="f5 fw6 db mb2 pt3">
          <FormattedMessage {...messages.databse} />
        </label>
        {databaseOptions.map((option) => (
          <label className="dib pr5" key={option.value}>
            <input
              value={option.value}
              checked={
                (option.value === 'OSM' && !metadata.sandbox) ||
                (metadata.sandbox && option.value !== 'OSM')
              }
              onChange={() =>
                updateMetadata({
                  ...metadata,
                  database: option.value === 'OSM' ? 'OSM' : SANDBOX_DB,
                  sandbox: option.value !== 'OSM',
                })
              }
              type="radio"
              className={`radio-input input-reset pointer v-mid dib h2 w2 mr2 br-100 ba b--blue-light`}
            />
            <FormattedMessage {...messages[`database${option.label}`]} />
          </label>
        ))}
      </>

      {error && (
        <Alert type="error">
          <FormattedMessage {...messages.creationFailed} values={{ error: error }} />
        </Alert>
      )}
    </>
  );
}
