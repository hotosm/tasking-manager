import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Form, Field } from 'react-final-form';
import Select from 'react-select';
import ReactPlaceholder from 'react-placeholder';
import { FormattedMessage, useIntl } from 'react-intl';

import messages from './messages';
import viewsMessages from '../../views/messages';
import { IMAGE_UPLOAD_SERVICE } from '../../config';
import { useUploadImage } from '../../hooks/UseUploadImage';
import { levels } from '../../hooks/UseOrganisationLevel';
import { Management } from './management';
import { InternalLinkIcon, ClipboardIcon } from '../svgIcons';
import { Button } from '../button';
import { UserAvatarList } from '../user/avatar';
import { nCardPlaceholders } from './organisationsPlaceholder';
import { Alert } from '../alert';
import { TextField } from '../formInputs';

export function OrgsManagement({
  organisations,
  isOrgManager,
  isAdmin,
  userOrgsOnly,
  setUserOrgsOnly,
  isOrganisationsFetched,
}: Object) {
  const [searchQuery, setSearchQuery] = useState('');

  const onSearchInputChange = (e) => setSearchQuery(e.target.value);

  const filteredOrganisations = organisations?.filter((organisation) =>
    organisation.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
      <ReactPlaceholder
        showLoadingAnimation={true}
        customPlaceholder={nCardPlaceholders(4)}
        delay={10}
        ready={isOrganisationsFetched}
      >
        <div className="w-20-l w-25-m">
          <TextField
            value={searchQuery}
            placeholderMsg={messages.searchOrganisations}
            onChange={onSearchInputChange}
            onCloseIconClick={() => setSearchQuery('')}
          />
        </div>
        {isOrgManager ? (
          filteredOrganisations?.length ? (
            filteredOrganisations.map((org, n) => <OrganisationCard details={org} key={n} />)
          ) : (
            <div className="pb5">
              <FormattedMessage {...messages.noOrganisationsFound} />
            </div>
          )
        ) : (
          <div>
            <FormattedMessage {...messages.notAllowed} />
          </div>
        )}
      </ReactPlaceholder>
    </Management>
  );
}

export function OrganisationCard({ details }: Object) {
  return (
    <Link to={`${details.organisationId}/`} className="w-50-l w-100 fl pr3">
      <div className="bg-white blue-dark mv2 pb4 dib w-100 ba br1 b--grey-light shadow-hover">
        <div className="w-25 h4 fl pa3">
          {details.logo && <img src={details.logo} alt={`${details.name} logo`} className="w-70" />}
        </div>
        <div className="w-75 fl pl3">
          <div className="w-100 dib">
            <h3 className="barlow-condensed ttu f3 mb2 mt2 truncate" lang="en">
              {details.name}
            </h3>
          </div>
          <div className="w-100 dib pt2 fl">
            <h4 className="ttu blue-grey f6">
              <FormattedMessage {...messages.managers} />
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
  return (
    <Form
      onSubmit={(values) => props.updateOrg(values)}
      initialValues={props.organisation}
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
                <FormattedMessage {...messages.orgInfo} />
              </h3>
              <form id="org-form" onSubmit={handleSubmit}>
                <fieldset className="bn pa0" disabled={submitting}>
                  <OrgInformation
                    hasSlug={props.organisation && props.organisation.slug}
                    formState={values}
                  />
                </fieldset>
              </form>
              {props.errorMessage && (
                <div className="mt2">
                  <Alert type="error" compact>
                    {viewsMessages[`orgCreation${props.errorMessage}Error`] ? (
                      <FormattedMessage
                        {...viewsMessages[`orgCreation${props.errorMessage}Error`]}
                      />
                    ) : (
                      <FormattedMessage {...viewsMessages[`errorFallback`]} />
                    )}
                  </Alert>
                </div>
              )}
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
}

const TYPE_OPTIONS = [
  { label: <FormattedMessage {...messages.free} />, value: 'FREE' },
  { label: <FormattedMessage {...messages.discounted} />, value: 'DISCOUNTED' },
  { label: <FormattedMessage {...messages.defaultFee} />, value: 'FULL_FEE' },
];
const TIER_OPTIONS = levels.map((level) => ({
  label: <FormattedMessage {...messages[`${level.tier}Tier`]} />,
  value: level.level,
}));

export function OrgInformation({ hasSlug, formState }) {
  const token = useSelector((state) => state.auth.token);
  const userDetails = useSelector((state) => state.auth.userDetails);
  const [uploadError, uploading, uploadImg] = useUploadImage();
  const intl = useIntl();
  //eslint-disable-next-line
  const labelClasses = 'db pt3 pb2';
  const fieldClasses = 'blue-grey w-100 pv3 ph2 input-reset ba b--grey-light bg-transparent';

  const getTypePlaceholder = (value) => {
    const selected = TYPE_OPTIONS.filter((type) => value === type.value);
    return selected.length ? selected[0].label : <FormattedMessage {...messages.selectType} />;
  };

  const getTierPlaceholder = (value) => {
    const selected = TIER_OPTIONS.filter((tier) => value === tier.value);
    return selected.length ? selected[0].label : <FormattedMessage {...messages.selectTier} />;
  };

  const validateRequired = (value) =>
    value ? undefined : <FormattedMessage {...messages.requiredField} />;

  const handleCopyToClipboard = (text) => navigator.clipboard.writeText(text);

  return (
    <>
      <div className="cf">
        <label className={labelClasses}>
          <FormattedMessage {...messages.name} />
        </label>
        <Field name="name" component="input" type="text" className={fieldClasses} required />
      </div>
      {hasSlug ? (
        <div className="cf">
          <label className={labelClasses}>
            <FormattedMessage {...messages.publicUrl} />
          </label>
          <Field name="slug" component="input" className={fieldClasses} required>
            {(props) => (
              <>
                <pre className="f6 di bg-tan blue-grey pa2">/organisations/{props.input.value}</pre>
                <Link
                  to={`/organisations/${props.input.value}/`}
                  className="link blue-light ph2 hover-blue-dark"
                >
                  <InternalLinkIcon className="h1 w1 v-mid" />
                </Link>
                <span
                  className="pointer blue-light hover-blue-dark"
                  title={intl.formatMessage(messages.copyPublicUrl)}
                >
                  <ClipboardIcon
                    role="button"
                    className="h1 w1 ph1 v-mid"
                    onClick={() =>
                      handleCopyToClipboard(
                        `${window.location.origin}/organisations/${props.input.value}/`,
                      )
                    }
                  />
                </span>
              </>
            )}
          </Field>
        </div>
      ) : (
        <></>
      )}
      <div className="cf">
        <label className={labelClasses}>
          <FormattedMessage {...messages.website} />
        </label>
        <Field name="url" component="input" type="text" className={fieldClasses} />
      </div>
      <div className="cf">
        <label className={labelClasses}>
          <FormattedMessage {...messages.description} />
        </label>
        <Field name="description" component="textarea" className={fieldClasses} />
      </div>
      {userDetails &&
        userDetails.role === 'ADMIN' && ( // only admin users can edit the org type and subscribed tier
          <>
            <div className="cf">
              <label className={labelClasses}>
                <FormattedMessage {...messages.type} />
              </label>
              <Field name="type" className={fieldClasses} validate={validateRequired}>
                {(props) => (
                  <>
                    <Select
                      classNamePrefix="react-select"
                      isClearable={false}
                      options={TYPE_OPTIONS}
                      placeholder={getTypePlaceholder(props.input.value)}
                      onChange={(value) => props.input.onChange(value.value)}
                      className="z-5"
                    />
                    {props.meta.error && props.meta.touched && (
                      <span className="mt3 red">{props.meta.error}</span>
                    )}
                  </>
                )}
              </Field>
            </div>
            {['DISCOUNTED', 'FULL_FEE'].includes(formState.type) && (
              <div className="cf">
                <label className={labelClasses}>
                  <FormattedMessage {...messages.subscribedTier} />
                </label>
                <Field name="subscriptionTier" className={fieldClasses} validate={validateRequired}>
                  {(props) => (
                    <>
                      <Select
                        classNamePrefix="react-select"
                        isClearable={false}
                        options={TIER_OPTIONS}
                        placeholder={getTierPlaceholder(props.input.value)}
                        onChange={(value) => props.input.onChange(value.value)}
                        className="z-4"
                      />
                      {props.meta.error && props.meta.touched && (
                        <span className="mt3 red">{props.meta.error}</span>
                      )}
                    </>
                  )}
                </Field>
              </div>
            )}
          </>
        )}
      <div className="cf">
        <label className={labelClasses}>
          <FormattedMessage {...messages.image} />
        </label>
        {IMAGE_UPLOAD_SERVICE ? (
          <Field name="logo" className={fieldClasses}>
            {(fieldProps) => (
              <>
                <input
                  type="file"
                  multiple={false}
                  accept="image/png, image/jpeg, image/webp"
                  onChange={(e) => uploadImg(e.target.files[0], fieldProps.input.onChange, token)}
                />
                <ReactPlaceholder
                  type="media"
                  className="pt2"
                  rows={0}
                  showLoadingAnimation={true}
                  ready={!uploading}
                >
                  <img
                    src={fieldProps.input.value}
                    alt={fieldProps.input.value}
                    className="h3 db pt2"
                  />
                  {uploadError && <FormattedMessage {...messages.imageUploadFailed} />}
                </ReactPlaceholder>
              </>
            )}
          </Field>
        ) : (
          <Field name="logo" component="input" type="text" className={fieldClasses} />
        )}
      </div>
    </>
  );
}

export function CreateOrgInfo({ formState }) {
  return (
    <div className="bg-white b--grey-light ba pa4 mb3">
      <h3 className="f3 blue-dark mv0 fw6">
        <FormattedMessage {...messages.orgInfo} />
      </h3>
      <OrgInformation hasSlug={false} formState={formState} />
    </div>
  );
}
