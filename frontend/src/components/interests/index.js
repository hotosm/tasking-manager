import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Form, Field } from 'react-final-form';
import { FormattedMessage } from 'react-intl';
import ReactPlaceholder from 'react-placeholder';

import messages from '../teamsAndOrgs/messages';
import { Management } from '../teamsAndOrgs/management';
import { HashtagIcon } from '../svgIcons';
import { Button } from '../button';
import { nCardPlaceholders } from '../teamsAndOrgs/campaignsPlaceholder';
import { TextField } from '../formInputs';

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

export const InterestsManagement = ({ interests, _userDetails, isInterestsFetched }) => {
  const [query, setQuery] = useState('');

  const onSearchInputChange = (e) => setQuery(e.target.value);

  const filteredInterests = interests?.filter((interest) =>
    interest.name.toLowerCase().includes(query.toLowerCase()),
  );

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
      <ReactPlaceholder
        showLoadingAnimation={true}
        customPlaceholder={nCardPlaceholders(4)}
        delay={10}
        ready={isInterestsFetched}
      >
        <div className="w-20-l w-25-m">
          <TextField
            value={query}
            placeholderMsg={messages.searchCategories}
            onChange={onSearchInputChange}
            onCloseIconClick={() => setQuery('')}
          />
        </div>
        {filteredInterests?.length ? (
          filteredInterests.map((i, n) => <InterestCard key={n} interest={i} />)
        ) : (
          <div>
            <FormattedMessage {...messages.noCategories} />
          </div>
        )}
      </ReactPlaceholder>
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
  return (
    <Form
      onSubmit={(values) => props.updateInterest(values)}
      initialValues={props.interest}
      render={({
        handleSubmit,
        dirty,
        submitSucceeded,
        dirtySinceLastSubmit,
        form,
        submitting,
        values,
      }) => {
        const dirtyForm = submitSucceeded ? dirtySinceLastSubmit && dirty : dirty;
        return (
          <div className="blue-grey mb3">
            <div className={`bg-white b--grey-light pa4 ${dirtyForm ? 'bt bl br' : 'ba'}`}>
              <h3 className="f3 fw6 dib blue-dark mv0">
                <FormattedMessage {...messages.categoryInfo} />
              </h3>
              <form id="interest-form" onSubmit={handleSubmit}>
                <fieldset className="bn pa0" disabled={submitting}>
                  <InterestInformation />
                </fieldset>
              </form>
            </div>
            {dirtyForm && (
              <div className="cf pt0 h3">
                <div className="w-70-l w-50 fl tr dib bg-grey-light">
                  <Button className="blue-dark bg-grey-light h3" onClick={() => form.restart()}>
                    <FormattedMessage {...messages.cancel} />
                  </Button>
                </div>
                <div className="w-30-l w-50 h-100 fr dib">
                  <Button
                    onClick={() => handleSubmit()}
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
