import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Form, Field } from 'react-final-form';

import ReactPlaceholder from 'react-placeholder';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import viewsMessages from '../../views/messages';

import { Management } from '../teamsAndOrgs/management';

import { Button, CustomButton } from '../button';
import { EditIcon } from '../svgIcons';
import { ChartLineIcon } from '../svgIcons';
import { nCardPlaceholders } from '../teamsAndOrgs/organisationsPlaceholder';
import { Alert } from '../alert';
import { TextField } from '../formInputs';

export function PartnersManagement({ partners, isAdmin, isPartnersFetched }) {
  const [searchQuery, setSearchQuery] = useState('');
  const onSearchInputChange = (e) => setSearchQuery(e.target.value);
  const filteredPartners = partners?.filter((partner) =>
    partner.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Management
      title={
        <FormattedMessage
          {...messages.partnerManage}
          values={{ entity: <FormattedMessage {...messages.partners} /> }}
        />
      }
      showAddButton={isAdmin}
      userOnlyLabel={<FormattedMessage {...messages.myPartners} />}
    >
      <ReactPlaceholder
        showLoadingAnimation={true}
        customPlaceholder={nCardPlaceholders(4)}
        delay={10}
        ready={isPartnersFetched}
      >
        <div className="w-20-l w-25-m mb2">
          <TextField
            value={searchQuery}
            placeholderMsg={messages.searchPartners}
            onChange={onSearchInputChange}
            onCloseIconClick={() => setSearchQuery('')}
          />
        </div>
        <div className="cards-container">
          {isAdmin ? (
            filteredPartners?.length ? (
              filteredPartners.map((partner) => <PartnersCard details={partner} key={partner.id} />)
            ) : (
              <div className="pb5">
                <FormattedMessage {...messages.noPartnersFound} />
              </div>
            )
          ) : (
            <div>
              <FormattedMessage {...messages.notAllowedPartners} />
            </div>
          )}
        </div>
      </ReactPlaceholder>
    </Management>
  );
}

export function PartnersCard({ details }) {
  return (
    <div className="bg-white flex flex-column items-center pa4 justify-between shadow-4">
      <div className="flex flex-column items-center">
        <div className="h2">
          {details.logo_url && (
            <img src={details.logo_url} alt={`${details.name} logo`} className="h2" />
          )}
        </div>
        <h3 className="barlow-condensed ttu f3 truncate" lang="en">
          {details.name}
        </h3>
        <h4 className="ttu blue-grey f6 card-text-ellipsis ma0 tc" title={details?.primary_hashtag}>
          {details?.primary_hashtag}
        </h4>
      </div>

      <div className="flex flex-column items-center" style={{ gap: '1.2rem' }}>
        <Link to={`${details.id}/`}>
          <CustomButton
            className="bg-red ba b--red white pv2 ph3"
            icon={<EditIcon className="h1 v-mid" />}
          >
            <FormattedMessage {...messages.edit} />
          </CustomButton>
        </Link>
        <Link to={`/partners/${details.permalink}/stats/`}>
          <CustomButton
            style={{ backgroundColor: '#e2e2e2' }}
            className="blue-dark ba b--grey-light pa2 br1 f5 pointer"
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
                    partnerWebpageLink={props.partner.website_links}
                    formState={values}
                  />
                </fieldset>
              </form>
              {props.errorMessage && (
                <div className="mt2">
                  {props.errorMessage && (
                    <Alert type="error" compact>
                      {viewsMessages[`partnerEdit${props.errorMessage}Error`] ? (
                        <FormattedMessage
                          {...viewsMessages[`partnerEdit${props.errorMessage}Error`]}
                        />
                      ) : (
                        <FormattedMessage {...viewsMessages[`errorFallback`]} />
                      )}
                    </Alert>
                  )}
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

export function PartnersInformation({ hasSlug, setFormState, formState }) {
  const webLinkKeys = Array.from({ length: 5 }, (_, i) => i + 1);

  const labelClasses = 'db pt3 pb2';
  const fieldClasses = 'blue-grey w-100 pv3 p2 ph2 input-reset ba b--grey-light bg-transparent';
  const rowClass = 'flex flex-wrap justify-start';
  const containerClases = 'mh3 w-40-l w-100-sm  w-100';
  return (
    <>
      <div className={rowClass}>
        <div className={containerClases}>
          <label className={labelClasses}>
            <FormattedMessage {...messages.name} />
          </label>
          <Field name="name" component="input" type="text" className={fieldClasses} required />
        </div>
        <div className={containerClases}>
          <label className={labelClasses}>
            <FormattedMessage {...messages.permalink} />
          </label>
          <Field name="permalink" component="input" type="text" className={fieldClasses} required />
        </div>
        <div className={containerClases}>
          <label className={labelClasses}>
            <FormattedMessage {...messages.primaryhashtag} required />
          </label>
          <Field
            name="primary_hashtag"
            component="input"
            type="text"
            className={fieldClasses}
            required
          />
        </div>
        <div className={containerClases}>
          <label className={labelClasses}>
            <FormattedMessage {...messages.secondaryhashtag} />
          </label>
          <Field name="secondary_hashtag" component="input" type="text" className={fieldClasses} />
        </div>
      </div>
      <div className={rowClass}>
        <div className={containerClases}>
          <label className={labelClasses}>
            <FormattedMessage {...messages.metaLink} />
          </label>
          <Field name="link_meta" component="input" type="text" className={fieldClasses} />
        </div>
        <div className={containerClases}>
          <label className={labelClasses}>
            <FormattedMessage {...messages.xLink} />
          </label>
          <Field name="link_x" component="input" type="text" className={fieldClasses} />
        </div>
        <div className={containerClases}>
          <label className={labelClasses}>
            <FormattedMessage {...messages.instagramLink} />
          </label>
          <Field name="link_instagram" component="input" type="text" className={fieldClasses} />
        </div>
        <div className={containerClases}>
          <label className={labelClasses}>
            <FormattedMessage {...messages.currentProjects} />
          </label>
          <Field name="current_projects" component="input" type="text" className={fieldClasses} />
        </div>
        <div className="w-100">
          {webLinkKeys.map((webLink, index) => (
            <div className="w-100 flex flex-wrap">
              <div className={containerClases}>
                <label className={labelClasses}>
                  <FormattedMessage {...messages.name} />
                </label>
                <Field
                  name={`name_${index + 1}`}
                  component="input"
                  type="text"
                  className={fieldClasses}
                />
              </div>
              <div className={containerClases}>
                <label className={labelClasses}>
                  <FormattedMessage {...messages.partnerLink} />
                </label>
                <Field
                  name={`url_${index + 1}`}
                  component="input"
                  type="text"
                  className={fieldClasses}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="cf mh3">
        <label className={labelClasses}>
          <FormattedMessage {...messages.image} />
        </label>
        <Field name="logo_url" component="input" type="text" className={fieldClasses} />
      </div>

      <div className={rowClass}>
        <div className={containerClases}>
          <label className={labelClasses}>
            <FormattedMessage {...messages.mapSwipeGroupId} />
          </label>
          <Field name="mapswipe_group_id" component="input" type="text" className={fieldClasses} />
        </div>
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
