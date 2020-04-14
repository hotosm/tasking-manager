import React from 'react';
import { Link } from '@reach/router';
import { FormattedMessage } from 'react-intl';
import { Form, Field } from 'react-final-form';

import messages from './messages';
import { EditModeControl } from './editMode';
import { Management } from './management';
import { Button } from '../button';
import { UserAvatarList } from '../user/avatar';

export function OrgsManagement({
  organisations,
  isOrgManager,
  isAdmin,
  userOrgsOnly,
  setUserOrgsOnly,
}: Object) {
  return (
    <Management
      title={
        <FormattedMessage
          {...messages.manage}
          values={{ entity: <FormattedMessage {...messages.organisations} /> }}
        />
      }
      showAddButton={isAdmin}
      managementView={true}
      userOnlyLabel={<FormattedMessage {...messages.myOrganisations} />}
      userOnly={userOrgsOnly}
      setUserOnly={setUserOrgsOnly}
      isAdmin={isAdmin}
    >
      {isOrgManager ? (
        organisations.map((org, n) => <OrganisationCard details={org} key={n} />)
      ) : (
        <div>
          <FormattedMessage {...messages.notAllowed} />
        </div>
      )}
    </Management>
  );
}

export function OrganisationCard({ details }: Object) {
  return (
    <Link to={`${details.organisationId}/`} className="w-50-l w-100 fl pr3">
      <div className="bg-white blue-dark mv2 pb4 dib w-100 ba br1 b--grey-light shadow-hover">
        <div className="w-25 h4 fl pa3">
          {details.logo && <img src={details.logo} alt={`${details.name} logo`} className="w-80" />}
        </div>
        <div className="w-75 fl pl3">
          <div className="w-100 dib">
            <h3 className="barlow-condensed ttu f3 mb2 mt2 truncate">{details.name}</h3>
            <span>
              {details.url && (
                <a
                  className="blue-grey link pointer"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={details.url}
                >
                  {details.url}
                </a>
              )}
            </span>
          </div>
          <div className="w-100 dib pt2 fl">
            <h4 className="ttu blue-grey f6">
              <FormattedMessage {...messages.administrators} />
            </h4>
            <div className="dib">
              <UserAvatarList
                size="small"
                textColor="white"
                users={details.managers}
                maxLength={12}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function OrganisationForm(props) {
  const labelClasses = 'db pt3 pb2';
  const fieldClasses = 'blue-grey w-100 pv3 ph2 input-reset ba b--grey-light bg-transparent';
  const { editMode, setEditMode } = props;

  return (
    <Form
      onSubmit={(values) => props.updateOrg(values)}
      initialValues={props.organisation}
      render={({ handleSubmit, pristine, form, submitting, values }) => {
        return (
          <div className="blue-grey mb3">
            <div className={`bg-white b--grey-light pa4 ${editMode ? 'bt bl br' : 'ba'}`}>
              <h3 className="f3 fw6 dib blue-dark mv0">
                <FormattedMessage {...messages.orgInfo} />
              </h3>
              <EditModeControl editMode={editMode} switchModeFn={setEditMode} />
              <form id="org-form" onSubmit={handleSubmit}>
                <fieldset
                  className="bn pa0"
                  disabled={submitting || props.disabledForm || !editMode}
                >
                  <div className="cf">
                    <label className={labelClasses}>
                      <FormattedMessage {...messages.name} />
                    </label>
                    <Field
                      name="name"
                      component="input"
                      type="text"
                      className={fieldClasses}
                      required
                    />
                  </div>
                  <div className="cf">
                    <label className={labelClasses}>
                      <FormattedMessage {...messages.website} />
                    </label>
                    <Field name="url" component="input" type="text" className={fieldClasses} />
                  </div>
                  <div className="cf">
                    <label className={labelClasses}>
                      <FormattedMessage {...messages.image} />
                    </label>
                    <Field
                      name="logo"
                      component="input"
                      type="text"
                      className={fieldClasses}
                      required
                    />
                  </div>
                </fieldset>
              </form>
            </div>
            {editMode && (
              <div className="cf pt0 h3 flex justify-end bg-grey-light">
                {props.updateError && (
                  <div className="w-40-l w-50 tc flex justify-center items-center bg-red white">
                    <FormattedMessage {...messages.updateError} />
                  </div>
                )}
                <div className="w-30-l w-50 flex justify-center items-center">
                  <Button className="blue-dark bg-grey-light h3" onClick={() => setEditMode(false)}>
                    <FormattedMessage {...messages.cancel} />
                  </Button>
                </div>
                <div className="w-30-l w-50 h-100 dib">
                  <Button
                    onClick={() => {
                      document
                        .getElementById('org-form')
                        .dispatchEvent(new Event('submit', { cancelable: true }));
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
}

export function OrgInformation(props) {
  const labelClasses = 'db pt3 pb2';
  const fieldClasses = 'blue-grey w-100 pv3 ph2 input-reset ba b--grey-light bg-transparent';

  return (
    <div className="bg-white b--grey-light ba pa4 mb3">
      <h3 className="f3 blue-dark mv0 fw6">
        <FormattedMessage {...messages.orgInfo} />
      </h3>
      <div className="cf">
        <label className={labelClasses}>
          <FormattedMessage {...messages.name} />
        </label>
        <Field name="name" component="input" type="text" className={fieldClasses} required />
      </div>
      <div className="cf">
        <label className={labelClasses}>
          <FormattedMessage {...messages.website} />
        </label>
        <Field name="url" component="input" type="text" className={fieldClasses} />
      </div>
      <div className="cf">
        <label className={labelClasses}>
          <FormattedMessage {...messages.image} />
        </label>
        <Field name="logo" component="input" type="text" className={fieldClasses} required />
      </div>
    </div>
  );
}
