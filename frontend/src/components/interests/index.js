import React, { useState } from 'react';
import { Link } from '@reach/router';
import { Form, Field } from 'react-final-form';
import { FormattedMessage } from 'react-intl';

import messages from '../teamsAndOrgs/messages';
import { Management } from '../teamsAndOrgs/management';
import { EditModeControl } from '../teamsAndOrgs/editMode';
import { HashtagIcon } from '../svgIcons';
import { Button } from '../button';

export const InterestCard = ({ interest }) => {
  return (
    <Link to={`${interest.id}/`} className="w-50-ns w-100 fl pr3">
      <div className="cf bg-white blue-dark br1 mv2 pv4 ph3 ba br1 b--grey-light shadow-hover">
        <div className="dib v-mid pr3">
          <div className="z-1 fl br-100 tc h2 w2 bg-blue-light white">
            <span className="relative w-50 dib">
              <HashtagIcon style={{ paddingTop: '0.4175rem' }} />
            </span>
          </div>
        </div>
        <h3 className="f3 mv0 dib v-mid">{interest.name}</h3>
      </div>
    </Link>
  );
};

export const InterestsManagement = ({ interests, userDetails }) => {
  return (
    <Management
      title={
        <FormattedMessage
          {...messages.manage}
          values={{ entity: <FormattedMessage {...messages.categories} /> }}
        />
      }
      showAddButton={true}
      managementView
    >
      {interests.length ? (
        interests.map((i, n) => <InterestCard interest={i} />)
      ) : (
        <div>
          <FormattedMessage {...messages.noCategories} />
        </div>
      )}
    </Management>
  );
};

export const InterestInformation = (props) => {
  const labelClasses = 'db pt3 pb2';
  const fieldClasses = 'blue-grey w-100 pv3 ph2 input-reset ba b--grey-light bg-transparent';

  return (
    <>
      <div className="cf">
        <label className={labelClasses}>
          <FormattedMessage {...messages.name} />
        </label>
        <Field name="name" component="input" type="text" className={fieldClasses} required />
      </div>
    </>
  );
};

export const InterestForm = (props) => {
  const [editMode, setEditMode] = useState(false);

  return (
    <Form
      onSubmit={(values) => props.updateInterest(values)}
      initialValues={props.interest}
      render={({ handleSubmit, pristine, form, submitting, values }) => {
        return (
          <div className="blue-grey mb3">
            <div className={`bg-white b--grey-light pa4 ${editMode ? 'bt bl br' : 'ba'}`}>
              <h3 className="f3 fw6 dib blue-dark mv0">
                <FormattedMessage {...messages.categoryInfo} />
              </h3>
              <EditModeControl editMode={editMode} switchModeFn={setEditMode} />
              <form id="interest-form" onSubmit={handleSubmit}>
                <fieldset
                  className="bn pa0"
                  disabled={submitting || props.disabledForm || !editMode}
                >
                  <InterestInformation />
                </fieldset>
              </form>
            </div>
            {editMode && (
              <div className="cf pt0 h3">
                <div className="w-70-l w-50 fl tr dib bg-grey-light">
                  <Button className="blue-dark bg-grey-light h3" onClick={() => setEditMode(false)}>
                    <FormattedMessage {...messages.cancel} />
                  </Button>
                </div>
                <div className="w-30-l w-50 h-100 fr dib">
                  <Button
                    onClick={() => {
                      document
                        .getElementById('interest-form')
                        .dispatchEvent(new Event('submit', { cancelable: true }));
                      setEditMode(false);
                    }}
                    className="w-100 h-100 bg-red white"
                    disabledClassName="bg-red o-50 white w-100 h-100"
                  >
                    <FormattedMessage {...messages.save} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      }}
    ></Form>
  );
};
