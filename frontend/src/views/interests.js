import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useFetch } from '../hooks/UseFetch';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Form } from 'react-final-form';
import { FormattedMessage } from 'react-intl';
import toast from 'react-hot-toast';

import messages from './messages';
import { InterestsManagement, InterestForm, InterestInformation } from '../components/interests';
import { FormSubmitButton, CustomButton } from '../components/button';
import { Projects } from '../components/teamsAndOrgs/projects';
import { DeleteModal } from '../components/deleteModal';
import { pushToLocalJSONAPI } from '../network/genericJSONRequest';
import { useSetTitleTag } from '../hooks/UseMetaTags';
import { updateEntity } from '../utils/management';
import { EntityError } from '../components/alert';

export const CreateInterest = () => {
  useSetTitleTag('Create new category');
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const [isError, setIsError] = useState(false);

  const createInterest = (payload) => {
    setIsError(false);
    pushToLocalJSONAPI('interests/', JSON.stringify(payload), token, 'POST')
      .then((result) => {
        toast.success(
          <FormattedMessage
            {...messages.entityCreationSuccess}
            values={{
              entity: 'category',
            }}
          />,
        );
        navigate(`/manage/categories/${result.id}`);
      })
      .catch(() => {
        setIsError(true);
      });
  };

  return (
    <Form
      onSubmit={(values) => createInterest(values)}
      render={({ handleSubmit, pristine, form, submitting, values }) => {
        return (
          <form onSubmit={handleSubmit} className="blue-grey">
            <div className="cf vh-100">
              <h3 className="f2 mb3 ttu blue-dark fw7 barlow-condensed">
                <FormattedMessage {...messages.newCategory} />
              </h3>
              <div className="w-40-l w-100 fl">
                <div className="bg-white b--grey-light ba pa4 mb3">
                  <h3 className="f3 blue-dark mv0 fw6">
                    <FormattedMessage {...messages.categoryInfo} />
                  </h3>
                  <InterestInformation />
                </div>
                {isError && <EntityError entity="category" />}
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
                  <FormattedMessage {...messages.createCategory} />
                </FormSubmitButton>
              </div>
            </div>
          </form>
        );
      }}
    ></Form>
  );
};

export const ListInterests = () => {
  useSetTitleTag('Manage categories');
  const userDetails = useSelector((state) => state.auth.userDetails);
  // TO DO: filter teams of current user
  const [error, loading, interests] = useFetch(`interests/`);
  const isInterestsFetched = !loading && !error;

  return (
    <InterestsManagement
      interests={interests.interests}
      userDetails={userDetails}
      isInterestsFetched={isInterestsFetched}
    />
  );
};

export const EditInterest = () => {
  const { id } = useParams();
  const userDetails = useSelector((state) => state.auth.userDetails);
  const token = useSelector((state) => state.auth.token);
  const [isError, setIsError] = useState(false);
  const [error, loading, interest] = useFetch(`interests/${id}/`);
  useSetTitleTag(`Edit ${interest.name}`);

  const [projectsError, projectsLoading, projects] = useFetch(
    `projects/?interests=${id}&omitMapResults=true`,
    id,
  );

  const onFailure = () => setIsError(true);

  const updateInterest = (payload) =>
    updateEntity(`interests/${id}/`, 'category', payload, token, null, onFailure);

  return (
    <div className="cf pv4 bg-tan">
      <div className="cf">
        <h3 className="f2 ttu blue-dark fw7 barlow-condensed v-mid ma0 dib ttu">
          <FormattedMessage {...messages.manageCategory} />
        </h3>
        <DeleteModal id={interest.id} name={interest.name} type="interests" />
      </div>
      <div className="w-40-l w-100 mt4 fl">
        <InterestForm
          userDetails={userDetails}
          interest={{ name: interest.name }}
          updateInterest={updateInterest}
          disabledForm={error || loading}
        />
        {isError && <EntityError entity="category" action="updation" />}
      </div>
      <div className="w-60-l w-100 mt4 pl5-l pl0 fr">
        <Projects
          projects={!projectsLoading && !projectsError && projects}
          viewAllEndpoint={`/manage/projects/?interests=${id}`}
          ownerEntity="category"
        />
      </div>
    </div>
  );
};
