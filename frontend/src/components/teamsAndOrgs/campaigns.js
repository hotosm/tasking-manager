import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { Form, Field } from 'react-final-form';
import ReactPlaceholder from 'react-placeholder';

import { nCardPlaceholders } from './campaignsPlaceholder';
import messages from './messages';
import { Management } from './management';
import { Button } from '../button';
import { HashtagIcon } from '../svgIcons';
import { TextField } from '../formInputs';

export function CampaignsManagement({ campaigns, userDetails, isCampaignsFetched }: Object) {
  const [query, setQuery] = useState('');

  const onSearchInputChange = (e) => setQuery(e.target.value);

  const filteredCampaigns = campaigns?.filter((campaign) =>
    campaign.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <Management
      title={
        <FormattedMessage
          {...messages.manage}
          values={{ entity: <FormattedMessage {...messages.campaigns} /> }}
        />
      }
      showAddButton={userDetails.role === 'ADMIN'}
      managementView
    >
      <ReactPlaceholder
        showLoadingAnimation={true}
        customPlaceholder={nCardPlaceholders(4)}
        delay={10}
        ready={isCampaignsFetched}
      >
        <div className="w-20-l w-25-m">
          <TextField
            value={query}
            placeholderMsg={messages.searchCampaigns}
            onChange={onSearchInputChange}
            onCloseIconClick={() => setQuery('')}
          />
        </div>
        {filteredCampaigns?.length ? (
          filteredCampaigns.map((campaign, n) => <CampaignCard campaign={campaign} key={n} />)
        ) : (
          <div>
            <FormattedMessage {...messages.noCampaigns} />
          </div>
        )}
      </ReactPlaceholder>
    </Management>
  );
}

export function CampaignCard({ campaign }: Object) {
  return (
    <Link to={`${campaign.id}/`} className="w-50-ns w-100 fl pr3">
      <div className="cf bg-white blue-dark br1 mv2 pv4 ph3 ba br1 b--grey-light shadow-hover">
        <div className="dib v-mid pr3">
          <div className="z-1 fl br-100 tc h2 w2 bg-blue-light white">
            <span className="relative w-50 dib">
              <HashtagIcon style={{ paddingTop: '0.4175rem' }} />
            </span>
          </div>
        </div>
        <h3 className="f3 mv0 dib v-mid">{campaign.name}</h3>
      </div>
    </Link>
  );
}

export function CampaignInformation(props) {
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
}

export function CampaignForm({
  userDetails,
  campaign,
  updateCampaignAsync,
  disabled,
  disableErrorAlert,
}) {
  return (
    <Form
      onSubmit={(values) => updateCampaignAsync.execute(values)}
      initialValues={campaign}
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
        if (dirtySinceLastSubmit) {
          disableErrorAlert();
        }
        return (
          <div className="blue-grey mb3">
            <div className={`bg-white b--grey-light pa4 ${dirtyForm ? 'bt bl br' : 'ba'}`}>
              <h3 className="f3 fw6 dib blue-dark mv0">
                <FormattedMessage {...messages.campaignInfo} />
              </h3>
              <form id="campaign-form" onSubmit={handleSubmit}>
                <fieldset className="bn pa0" disabled={submitting || disabled}>
                  <CampaignInformation />
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
                    loading={updateCampaignAsync.status === 'pending'}
                    disabled={updateCampaignAsync.status === 'pending'}
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
