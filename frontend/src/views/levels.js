import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Form } from 'react-final-form';
import { FormattedMessage } from 'react-intl';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import messages from './messages';
import { useSetTitleTag } from '../hooks/UseMetaTags';
import { useFetch } from '../hooks/UseFetch';
import { LevelInformation, LevelsManagement, LevelForm } from '../components/levels';
import { pushToLocalJSONAPI } from '../network/genericJSONRequest';
import { FormSubmitButton, CustomButton } from '../components/button';
import { EntityError } from '../components/alert';
import { DeleteModal } from '../components/deleteModal';
import { updateEntity } from '../utils/management';

export const EditLevel = () => {
  const { id } = useParams();
  const [error, loading, level] = useFetch(`levels/${id}/`);
  const [badgesError, loadingBadges, badges] = useFetch('badges/');
  const [isError, setIsError] = useState(false);
  const token = useSelector((state) => state.auth.token);

  const onFailure = () => setIsError(true);
  const updateLevel = (payload) => {
    setIsError(false);
    updateEntity(`levels/${id}/`, 'level', payload, token, null, onFailure);
  };

  return (
    <div className="cf pv4 bg-tan">
      <div className="cf">
        <h3 className="f2 ttu blue-dark fw7 barlow-condensed v-mid ma0 dib">
          <FormattedMessage {...messages.manageLevel} />
        </h3>
        <DeleteModal id={level.id} name={level.name} type="levels" />
      </div>
      <div className="w-50-l w-100 mt4 fl">
        <LevelForm
          level={level}
          badges={badges.badges}
          updateLevel={updateLevel}
          disabledForm={error || badgesError || loading || loadingBadges}
        />
        {isError && <EntityError entity="level" action="updation" />}
      </div>
    </div>
  );
};

export const ListLevels = () => {
  useSetTitleTag('Manage Levels');

  const [error, loading, result] = useFetch('levels/');
  const isFetched = !loading && !error;

  return (
    <LevelsManagement
      levels={result.levels}
      isFetched={isFetched}
    />
  );
};

export const CreateLevel = () => {
  useSetTitleTag('Create new level');
  const token = useSelector((state) => state.auth.token);
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();
  const [badgesError, loadingBadges, badges] = useFetch('badges/');

  const createLevel = async (payload) => {
    setIsError(false);

    try {
      await pushToLocalJSONAPI('levels/', JSON.stringify(payload), token, 'POST');

      toast.success(
        <FormattedMessage
          {...messages.entityCreationSuccess}
          values={{
            entity: 'level',
          }}
        />,
      );
      navigate(`/manage/levels/`);
    } catch (_error) {
      setIsError(true);
    }
  };

  return !badgesError && !loadingBadges && (
    <Form
      onSubmit={(values) => createLevel(values)}
      render={({ handleSubmit, pristine, submitting }) => {
        return (
          <form onSubmit={handleSubmit} className="blue-grey">
            <div className="cf vh-100">
              <h3 className="f2 mb3 ttu blue-dark fw7 barlow-condensed">
                <FormattedMessage {...messages.newLevel} />
              </h3>
              <div className="w-50-l w-100 fl">
                <div className="bg-white b--grey-light ba pa4 mb3">
                  <h3 className="f3 blue-dark mv0 fw6">
                    <FormattedMessage {...messages.levelInfo} />
                  </h3>
                  <LevelInformation badges={badges} />
                </div>
                {isError && <EntityError entity="level" />}
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
                  <FormattedMessage {...messages.createLevel} />
                </FormSubmitButton>
              </div>
            </div>
          </form>
        );
      }}
    ></Form>
  );
};
