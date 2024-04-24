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
import { Button, CustomButton } from '../button';
import { EditIcon } from '../svgIcons';
import { ChartLineIcon } from '../svgIcons';
import { nCardPlaceholders } from './organisationsPlaceholder';
import { Alert } from '../alert';
import { TextField } from '../formInputs';

export function PartnersManagement({
  partners,
  isOrgManager,
  isAdmin,
  userOrgsOnly,
  setUserOrgsOnly,
  isOrganisationsFetched,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const onSearchInputChange = (e) => setSearchQuery(e.target.value);
  const filteredOrganisations = partners?.filter((partner) =>
    partner.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div style={{ backgroundColor: '#F0EFEF' }}>
      <Management
        title={
          <FormattedMessage
            {...messages.manage}
            values={{ entity: <FormattedMessage {...messages.partners} /> }}
          />
        }
        showAddButton={true}
        managementView={false}
        userOnlyLabel={<FormattedMessage {...messages.myPartners} />}
        userOnly={userOrgsOnly}
        setUserOnly={setUserOrgsOnly}
        isAdmin={false}
      >
        <ReactPlaceholder
          showLoadingAnimation={true}
          customPlaceholder={nCardPlaceholders(4)}
          delay={10}
          ready={isOrganisationsFetched}
        >
          <div style={{ margin: 'auto', marginBottom: 20 }} className="w-20-l w-25-m ">
            <TextField
              value={searchQuery}
              placeholderMsg={messages.searchPartners}
              onChange={onSearchInputChange}
              onCloseIconClick={() => setSearchQuery('')}
            />
          </div>
          <div className="ph4 cards-container">
            {isOrgManager ? (
              filteredOrganisations?.length ? (
                filteredOrganisations.map((org, index) => (
                  <PartnersCard details={org} key={index} />
                ))
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
          </div>
        </ReactPlaceholder>
      </Management>
    </div>
  );
}

export function PartnersCard({ details }) {
  return (
    <div
      className="card"
      style={{
        backgroundColor: '#ffffff',
        color: '#002366',
        margin: '0.5rem',
        padding: '1rem',
        borderRadius: '0.25rem',
        border: '1px solid #cbd5e0',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: '1 1 100%' }}>
        {details.logo && <img src={details.logo} alt={`${details.name} logo`} className="w-20" />}
      </div>

      <div style={{ flex: '2 1 100%', textAlign: 'center' }}>
        <div>
          <h3 className="barlow-condensed ttu f3 mb2 mt2 truncate" lang="en">
            {details.primaryHashtag}
          </h3>
          <h4 className="ttu blue-grey f6">{details.secondaryHashtag}</h4>
        </div>
      </div>

      <div style={{ flex: '1 1 100%', textAlign: 'center', paddingTop: '1rem' }}>
        <Link to={`${details.name}/`} style={{ textDecoration: 'none', flex: 1 }}>
          <CustomButton
            className="bg-red ba b--red white pv2 ph3"
            icon={<EditIcon className="h1 v-mid" />}
          >
            <FormattedMessage {...messages.edit} />
          </CustomButton>
        </Link>
      </div>
      <div style={{ flex: '1 1 100%', textAlign: 'center', paddingTop: '1rem' }}>
        <Link to={`/partners/${details.name}/stats/`} style={{ textDecoration: 'none' }}>
          <CustomButton
            className="bg-red ba b--red white pv2 ph3"
            icon={<ChartLineIcon className="h1 v-mid" />}
          >
            <FormattedMessage {...messages.statistics} />
          </CustomButton>
        </Link>
      </div>
    </div>
  );
}

export function PartnersForm(props) {
  return (
    <Form
      onSubmit={(values) => props.updatePartner(values)}
      initialValues={props.partner}
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
                <FormattedMessage {...messages.partnersInfo} />
              </h3>
              <form id="org-form" onSubmit={handleSubmit}>
                <fieldset className="bn pa0" disabled={submitting}>
                  <PartnersInformation
                    //hasSlug={props.partner && props.organisation.slug}
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
              <div className="bottom-0 right-0 left-0 cf bg-white h3 fixed">
                <div className="w-80-ns w-60-m w-50 h-100 fl tr">
                  <Link to={'./'}>
                    <CustomButton
                      className="bg-white mr5 pr2 h-100 bn bg-white blue-dark"
                      onClick={() => form.restart()}
                    >
                      <FormattedMessage {...messages.cancel} />
                    </CustomButton>
                  </Link>
                </div>
                <div className="w-20-l w-40-m w-50 h-100 fr">
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

export function PartnersInformation({ hasSlug, formState }) {
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
          <FormattedMessage {...messages.primaryhashtag} />
        </label>
        <Field name="PrimaryHashtag" component="input" type="text" className={fieldClasses} />
      </div>
      <div className="cf">
        <label className={labelClasses}>
          <FormattedMessage {...messages.secondaryhashtag} />
        </label>
        <Field name="SecondaryHashtag" component="input" type="text" className={fieldClasses} />
      </div>
      <div className="cf">
        <label className={labelClasses}>
          <FormattedMessage {...messages.metaLink} />
        </label>
        <Field name="MetaLink" component="input" type="text" className={fieldClasses} />
      </div>
      <div className="cf">
        <label className={labelClasses}>
          <FormattedMessage {...messages.xLink} />
        </label>
        <Field name="XLink" component="input" type="text" className={fieldClasses} />
      </div>
      <div className="cf">
        <label className={labelClasses}>
          <FormattedMessage {...messages.instagramLink} />
        </label>
        <Field name="InstagramLink" component="input" type="text" className={fieldClasses} />
      </div>
      <div className="cf">
        <label className={labelClasses}>
          <FormattedMessage {...messages.website} />
        </label>
        <Field name="WebpageLink" component="input" type="text" className={fieldClasses} />
      </div>
      <div className="cf">
        <label className={labelClasses}>
          <FormattedMessage {...messages.feedbackLink} />
        </label>
        <Field name="FeedbackLink" component="input" type="text" className={fieldClasses} />
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

export function CreatePartnersInfo({ formState }) {
  return (
    <div className="bg-white b--grey-light ba pa4 mb3">
      <h3 className="f3 blue-dark mv0 fw6">
        <FormattedMessage {...messages.partnersInfo} />
      </h3>
      <PartnersInformation hasSlug={false} formState={formState} />
    </div>
  );
}
