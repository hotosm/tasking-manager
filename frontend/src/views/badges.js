import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Form } from 'react-final-form';
import { FormattedMessage } from 'react-intl';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import messages from './messages';
import { useSetTitleTag } from '../hooks/UseMetaTags';
import { useFetch } from '../hooks/UseFetch';
import { BadgeInformation, BadgesManagement, BadgeForm } from '../components/badges';
import { pushToLocalJSONAPI } from '../network/genericJSONRequest';
import { FormSubmitButton, CustomButton } from '../components/button';
import { EntityError } from '../components/alert';
import { DeleteModal } from '../components/deleteModal';
import { updateEntity } from '../utils/management';

export const EditBadge = () => {
  const { id } = useParams();
  const [error, loading, badge] = useFetch(`badges/${id}/`);
  const [isError, setIsError] = useState(false);
  const token = useSelector((state) => state.auth.token);

  const onFailure = () => setIsError(true);
  const updateBadge = (payload) => {
    setIsError(false);
    updateEntity(`badges/${id}/`, 'badge', payload, token, null, onFailure);
  };

  return (
    <div className="cf pv4 bg-tan">
      <div className="cf">
        <h3 className="f2 ttu blue-dark fw7 barlow-condensed v-mid ma0 dib">
          <FormattedMessage {...messages.manageBadge} />
        </h3>
        <DeleteModal id={badge.id} name={badge.name} type="badges" />
      </div>
      <div className="w-40-l w-100 mt4 fl">
        <BadgeForm
          badge={badge}
          updateBadge={updateBadge}
          disabledForm={error || loading}
        />
        {isError && <EntityError entity="badge" action="updation" />}
      </div>
    </div>
  );
};

export const ListBadges = () => {
  useSetTitleTag('Manage Badges');

  const [error, loading, result] = useFetch('badges/');
  const isFetched = !loading && !error;

  return (
    <BadgesManagement
      badges={result.badges}
      isFetched={isFetched}
    />
  );
};

export const CreateBadge = () => {
  useSetTitleTag('Create new badge');
  const token = useSelector((state) => state.auth.token);
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  const createBadge = (payload) => {
    setIsError(false);
    return pushToLocalJSONAPI('badges/', JSON.stringify(payload), token, 'POST')
      .then((result) => {
        toast.success(
          <FormattedMessage
            {...messages.entityCreationSuccess}
            values={{
              entity: 'badge',
            }}
          />,
        );
        navigate(`/manage/badges/`);
      })
      .catch(() => setIsError(true));
  };

  return (
    <Form
      onSubmit={(values) => createBadge(values)}
      render={({ handleSubmit, pristine, form, submitting, values }) => {
        return (
          <form onSubmit={handleSubmit} className="blue-grey">
            <div className="cf vh-100">
              <h3 className="f2 mb3 ttu blue-dark fw7 barlow-condensed">
                <FormattedMessage {...messages.newBadge} />
              </h3>
              <div className="w-40-l w-100 fl">
                <div className="bg-white b--grey-light ba pa4 mb3">
                  <h3 className="f3 blue-dark mv0 fw6">
                    <FormattedMessage {...messages.badgeInfo} />
                  </h3>
                  <BadgeInformation />
                </div>
                {isError && <EntityError entity="badge" />}
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
                  <FormattedMessage {...messages.createBadge} />
                </FormSubmitButton>
              </div>
            </div>
          </form>
        );
      }}
    ></Form>
  );
};
