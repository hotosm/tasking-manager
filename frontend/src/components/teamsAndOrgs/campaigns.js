import React, { useState, useEffect } from 'react';
import { Link } from '@reach/router';
import { FormattedMessage } from 'react-intl';
import { Form, Field } from 'react-final-form';

import messages from './messages';
import { Management } from './management';
import { EditModeControl } from './editMode';
import { Button } from '../button';
import { HashtagIcon } from '../svgIcons';

export function CampaignsManagement({ campaigns, userDetails }: Object) {
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
      {campaigns.length ? (
        campaigns.map((campaign, n) => <CampaignCard campaign={campaign} key={n} />)
      ) : (
        <div>
          <FormattedMessage {...messages.noCampaigns} />
        </div>
      )}
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

export function CampaignForm(props) {
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (props.saveError) setEditMode(true);
  }, [props.saveError]);

  return (
    <Form
      onSubmit={(values) => props.updateCampaign(values)}
      initialValues={props.campaign}
      render={({ handleSubmit, pristine, form, submitting, values }) => {
        return (
          <div className="blue-grey mb3">
            <div className={`bg-white b--grey-light pa4 ${editMode ? 'bt bl br' : 'ba'}`}>
              <h3 className="f3 fw6 dib blue-dark mv0">
                <FormattedMessage {...messages.campaignInfo} />
              </h3>
              <EditModeControl editMode={editMode} switchModeFn={setEditMode} />
              <form id="campaign-form" onSubmit={handleSubmit}>
                <fieldset
                  className="bn pa0"
                  disabled={submitting || props.disabledForm || !editMode}
                >
                  <CampaignInformation />
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
                        .getElementById('campaign-form')
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
}
