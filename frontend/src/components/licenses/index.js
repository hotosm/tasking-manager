import React from 'react';
import { Link } from '@reach/router';
import { Form, Field } from 'react-final-form';
import { FormattedMessage } from 'react-intl';

import messages from '../teamsAndOrgs/messages';
import { Management } from '../teamsAndOrgs/management';
import { CopyrightIcon } from '../svgIcons';
import { Button } from '../button';

export const LicenseCard = ({ license }) => {
  return (
    <Link to={`${license.licenseId}/`} className="w-50-ns w-100 fl pr3">
      <div className="cf bg-white blue-dark br1 mv2 pv4 ph3 ba br1 b--grey-light shadow-hover">
        <div className="dib v-mid pr3">
          <div className="z-1 fl br-100 tc h2 w2 bg-blue-light white">
            <span className="relative w-50 dib">
              <CopyrightIcon style={{ paddingTop: '0.475rem' }} />
            </span>
          </div>
        </div>
        <h3 className="f3 mv0 dib v-mid">{license.name}</h3>
      </div>
    </Link>
  );
};

export const LicensesManagement = ({ licenses, userDetails }) => {
  return (
    <Management
      title={
        <FormattedMessage
          {...messages.manage}
          values={{ entity: <FormattedMessage {...messages.licenses} /> }}
        />
      }
      showAddButton={true}
      managementView
    >
      {licenses.length ? (
        licenses.map((i, n) => <LicenseCard key={n} license={i} />)
      ) : (
        <div className="pv3">
          <FormattedMessage {...messages.noLicenses} />
        </div>
      )}
    </Management>
  );
};

export const LicenseInformation = () => {
  const labelClasses = 'db pt3 pb2';
  const fieldClasses = 'blue-grey w-100 pv3 ph2 input-reset ba b--grey-light bg-transparent';

  return (
    <>
      <div className="cf">
        <label className={labelClasses}>
          <FormattedMessage {...messages.name} />
        </label>
        <Field name="name" component="input" type="text" className={fieldClasses} required />
        <label className={labelClasses}>
          <FormattedMessage {...messages.description} />
        </label>
        <Field name="description" component="textarea" rows={7} className={fieldClasses} required />
        <label className={labelClasses}>
          <FormattedMessage {...messages.plainText} />
        </label>
        <Field name="plainText" component="textarea" rows={7} className={fieldClasses} required />
      </div>
    </>
  );
};

export const LicenseForm = ({ license, updateLicense, disabledForm }) => {
  return (
    <Form
      onSubmit={(values) => updateLicense(values)}
      initialValues={license}
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
                <FormattedMessage {...messages.licenseInfo} />
              </h3>
              <form id="license-form" onSubmit={handleSubmit}>
                <fieldset className="bn pa0" disabled={submitting}>
                  <LicenseInformation />
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
