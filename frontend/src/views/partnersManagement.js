import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, redirect, useNavigate, useParams } from 'react-router-dom';
import ReactPlaceholder from 'react-placeholder';
import { FormattedMessage } from 'react-intl';
import { Form } from 'react-final-form';
import toast from 'react-hot-toast';
import { useQueryParams, BooleanParam } from 'use-query-params';

import messages from './messages';
import { useFetch } from '../hooks/UseFetch';
import { useModifyMembers } from '../hooks/UseModifyMembers';
import { useEditOrgAllowed } from '../hooks/UsePermissions';
import data from '../utils/result.json';
import { Members } from '../components/teamsAndOrgs/members';
import { Teams } from '../components/teamsAndOrgs/teams';
import { Projects } from '../components/teamsAndOrgs/projects';
import {
  PartnersForm,
  CreatePartnersInfo,
  PartnersManagement,
} from '../components/teamsAndOrgs/partners';
import { FormSubmitButton, CustomButton } from '../components/button';
import { ChartLineIcon } from '../components/svgIcons';
import { DeleteModal } from '../components/deleteModal';
import { useSetTitleTag } from '../hooks/UseMetaTags';
import { Alert } from '../components/alert';
import { updateEntity } from '../utils/management';
import { fetchLocalJSONAPI, pushToLocalJSONAPI } from '../network/genericJSONRequest';

export function ListPartners() {
  useSetTitleTag('Manage partners');
  const token = true; //useSelector((state) => state.auth.token);
  const userDetails = 1; //useSelector((state) => state.auth.userDetails);
  const isOrgManager = true; //useSelector(    (state) => state.auth.organisations && state.auth.organisations.length > 0,  );
  const [partners, setPartners] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useQueryParams({
    showAll: BooleanParam,
  });
  const [userOrgsOnly, setUserOrgsOnly] = useState(Boolean(!query.showAll));

  useEffect(() => {
    setQuery({ ...query, showAll: userOrgsOnly === false ? true : undefined });
    //eslint-disable-next-line
  }, [userOrgsOnly]);

  /*   useEffect(() => {
    if (true) {
      setLoading(true);
      setPartners(data);
      setLoading(false);
    }
  }, [userDetails, token, userOrgsOnly]); */

  useEffect(() => {
    /*     if (token && userDetails?.id) { */
    setLoading(true);
    fetchLocalJSONAPI(`partners/`, true)
      .then((data) => {
        setPartners(data);
        setLoading(false);
      })
      .catch((err) => setError(err));
    /* } */
  }, [userDetails, token, userOrgsOnly]);

  return (
    <PartnersManagement
      partners={partners}
      userOrgsOnly={userOrgsOnly}
      setUserOrgsOnly={setUserOrgsOnly}
      isOrgManager={userDetails.role === 'ADMIN' || isOrgManager}
      isAdmin={userDetails.role === 'ADMIN'}
      isPartnersFetched={!loading && !error}
    />
  );
}

export function CreatePartner() {
  useSetTitleTag('Create new partner');
  const navigate = useNavigate();
  const userDetails = useSelector((state) => state.auth.userDetails);
  const token = useSelector((state) => state.auth.token);
  const {
    members: managers,
    setMembers: setManagers,
    addMember: addManagers,
    removeMember: removeManagers,
  } = useModifyMembers([{ username: userDetails.username, pictureUrl: userDetails.pictureUrl }]);
  const [error, setError] = useState(null);
  const createPartner = (payload) => {
    pushToLocalJSONAPI('partners/', JSON.stringify(payload), token, 'POST')
      .then((result) => {
        toast.success(
          <FormattedMessage
            {...messages.entityCreationSuccess}
            values={{
              entity: 'partner',
            }}
          />,
        );
        navigate(`manage/partners/`);
      })
      .catch((err) => {
        setError(err.message);
      });
  };

  return (
    <div style={{ backgroundColor: '#f1f1f1' }}>
      <Form
        onSubmit={(values) => createPartner(values)}
        render={({ handleSubmit, pristine, form, submitting, values }) => {
          return (
            <form
              onSubmit={handleSubmit}
              style={{ margin: 'auto' }}
              className="blue-grey  w-50-l w-50-m "
            >
              <div className="w-100 cf pv4 pb5 ">
                <h3
                  style={{ textAlign: 'center' }}
                  className="f2 mb3 ttu blue-dark fw7 ma0 barlow-condensed "
                >
                  <FormattedMessage {...messages.newPartner} />
                </h3>
                <div className="">
                  <CreatePartnersInfo formState={values} />
                  <div className="cf pv2 ml2">
                    {error && (
                      <Alert type="error" compact>
                        {messages[`partnerCreation${error}Error`] ? (
                          <FormattedMessage {...messages[`partnerCreation${error}Error`]} />
                        ) : (
                          <FormattedMessage
                            {...messages.entityCreationFailure}
                            values={{
                              entity: 'partner',
                            }}
                          />
                        )}
                      </Alert>
                    )}
                  </div>
                </div>
              </div>
              <div className="bottom-0 right-0 left-0 cf bg-white h3 fixed">
                <div className="w-80-ns w-60-m w-50 h-100 fl tr">
                  <Link to={'/manage/partners'}>
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
                    <FormattedMessage {...messages.createPartner} />
                  </FormSubmitButton>
                </div>
              </div>
            </form>
          );
        }}
      ></Form>
    </div>
  );
}

export function EditPartners() {
  const { id } = useParams();
  const userDetails = useSelector((state) => state.auth.userDetails);
  const token = useSelector((state) => state.auth.token);

  const [error, loading, partner] = useFetch(`partners/${id}/`, id);

  const [errorMessage, setErrorMessage] = useState(null);
  useSetTitleTag(`Edit ${partner.name}`);
  const navigate = useNavigate();
  const updatePartner = (payload) => {
    console.log(payload);
    const onSuccess = () => setErrorMessage(null);
    const onFailure = (error) => setErrorMessage(error.message);
    updateEntity(`partners/${id}/`, 'partner', payload, token, onSuccess, onFailure);
  };
  useEffect(() => {
    if (error) {
      navigate('*');
    }
  }, [error]);

  return (
    <div style={{ backgroundColor: '#f1f1f1' }}>
      <ReactPlaceholder
        showLoadingAnimation={true}
        type={'media'}
        rows={26}
        delay={100}
        ready={!error && loading === false && typeof partner === 'object'}
      >
        {true ? (
          <div style={{ margin: 'auto' }} className="cf w-50-l w-50-m ">
            <div style={{ textAlign: 'center' }} className="cf pv4 ">
              <h3 className="f2 ttu blue-dark fw7 ma0 barlow-condensed v-mid dib">
                <FormattedMessage {...messages.managePartner} />
              </h3>
              <DeleteModal id={id} name={id} type="partners" />
            </div>
            <div className="w-100 mt4 fl">
              <PartnersForm
                userDetails={userDetails}
                partner={partner}
                updatePartner={updatePartner}
                disabledForm={error || loading}
                errorMessage={errorMessage}
              />
            </div>
          </div>
        ) : (
          <div className="cf w-100 pv5">
            <div className="tc">
              <h3 className="f3 fw8 mb4 barlow-condensed">
                <FormattedMessage {...messages.editPartnerNotAllowed} />
              </h3>
            </div>
          </div>
        )}
      </ReactPlaceholder>
    </div>
  );
}
