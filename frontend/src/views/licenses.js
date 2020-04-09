import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useFetch } from '../hooks/UseFetch';
import { TextBlock, RectShape } from 'react-placeholder/lib/placeholders';
import ReactPlaceholder from 'react-placeholder';
import { Link, redirectTo } from '@reach/router';
import { Form } from 'react-final-form';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { LicenseInformation, LicensesManagement, LicenseForm } from '../components/licenses';
import { FormSubmitButton, CustomButton } from '../components/button';
import { DeleteModal } from '../components/deleteModal';
import { pushToLocalJSONAPI } from '../network/genericJSONRequest';

export const EditLicense = (props) => {
  const userDetails = useSelector((state) => state.auth.get('userDetails'));
  const token = useSelector((state) => state.auth.get('token'));
  const [error, loading, license] = useFetch(`licenses/${props.id}/`);

  const updateLicense = (payload) => {
    pushToLocalJSONAPI(`licenses/${props.id}/`, JSON.stringify(payload), token, 'PATCH');
  };

  return (
    <div className="cf pv4 bg-tan">
      <div className="cf">
        <h3 className="f2 ttu blue-dark fw7 barlow-condensed v-mid ma0 dib ttu">
          <FormattedMessage {...messages.manageLicense} />
        </h3>
        <DeleteModal id={license.licenseId} name={license.name} type="licenses" />
      </div>
      <div className="w-40-l w-100 mt4 fl">
        <LicenseForm
          userDetails={userDetails}
          license={license}
          updateLicense={updateLicense}
          disabledForm={error || loading}
        />
      </div>
    </div>
  );
};

export const ListLicenses = () => {
  const userDetails = useSelector((state) => state.auth.get('userDetails'));
  // TO DO: filter teams of current user
  const [error, loading, licenses] = useFetch(`licenses/`);

  const placeHolder = (
    <div className="pb4 bg-tan">
      <div className="w-50-ns w-100 cf ph6-l ph4">
        <TextBlock rows={1} className="bg-grey-light h3" />
      </div>
      <RectShape className="bg-white dib mv2 mh6" style={{ width: 250, height: 300 }} />
      <RectShape className="bg-white dib mv2 mh6" style={{ width: 250, height: 300 }} />
    </div>
  );

  return (
    <ReactPlaceholder
      showLoadingAnimation={true}
      customPlaceholder={placeHolder}
      delay={10}
      ready={!error && !loading}
    >
      <LicensesManagement licenses={licenses.licenses} userDetails={userDetails} />
    </ReactPlaceholder>
  );
};

export const CreateLicense = () => {
  const token = useSelector((state) => state.auth.get('token'));
  const [newLicenseId, setNewLicenseId] = useState(null);

  useEffect(() => {
    if (newLicenseId) {
      redirectTo(`/manage/licenses/${newLicenseId}`);
    }
  }, [newLicenseId]);

  const createLicense = (payload) => {
    pushToLocalJSONAPI('licenses/', JSON.stringify(payload), token, 'POST').then((result) =>
      setNewLicenseId(result.licenseId),
    );
  };

  return (
    <Form
      onSubmit={(values) => createLicense(values)}
      render={({ handleSubmit, pristine, form, submitting, values }) => {
        return (
          <form onSubmit={handleSubmit} className="blue-grey">
            <div className="cf vh-100">
              <h3 className="f2 mb3 ttu blue-dark fw7 barlow-condensed">
                <FormattedMessage {...messages.newLicense} />
              </h3>
              <div className="w-40-l w-100 fl">
                <div className="bg-white b--grey-light ba pa4 mb3">
                  <h3 className="f3 blue-dark mv0 fw6">
                    <FormattedMessage {...messages.licenseInfo} />
                  </h3>
                  <LicenseInformation />
                </div>
              </div>
              <div className="w-40-l w-100 fl pl5-l pl0 "></div>
            </div>
            <div className="fixed left-0 bottom-0 cf bg-white h3 w-100">
              <div className="w-80-ns w-60-m w-50 h-100 fl tr">
                <Link to={'../'}>
                  <CustomButton className="bg-white mr5 pr2 h-100 bn bg-white blue-dark">
                    <FormattedMessage {...messages.cancel} />
                  </CustomButton>
                </Link>
              </div>
              <div className="w-20-l w-40-m w-50 h-100 fr">
                <FormSubmitButton
                  disabled={submitting || pristine}
                  className="w-100 h-100 bg-red white"
                  disabledClassName="bg-red o-50 white w-100 h-100"
                >
                  <FormattedMessage {...messages.createLicense} />
                </FormSubmitButton>
              </div>
            </div>
          </form>
        );
      }}
    ></Form>
  );
};
