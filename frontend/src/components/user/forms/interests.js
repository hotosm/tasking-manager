import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import messages from '../messages';
import { Button } from '../../button';
import { InterestsList } from '../../formInputs';
import { fetchLocalJSONAPI, pushToLocalJSONAPI } from '../../../network/genericJSONRequest';

export function UserInterestsForm() {
  const token = useSelector((state) => state.auth.token);
  const userDetails = useSelector((state) => state.auth.userDetails);
  const [interests, setInterests] = useState([]);
  const [enableSaveButton, setEnableSaveButton] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const getInterests = async (username) => {
      const data = await fetchLocalJSONAPI(`users/${username}/queries/interests/`, token);
      setInterests(data.interests);
    };

    if (userDetails.username) {
      getInterests(userDetails.username);
    }
  }, [token, userDetails]);

  const changeSelect = (id) => {
    const index = interests.findIndex((i) => i.id === id);

    const copy = interests.map((interest, idx) => {
      if (idx === index) {
        interest.userSelected = !interest.userSelected;
      }
      return interest;
    });
    setEnableSaveButton(true);
    setSuccess(null);
    setInterests(copy);
  };

  const updateInterests = () => {
    const postUpdate = (ids) => {
      pushToLocalJSONAPI(
        'users/me/actions/set-interests/',
        JSON.stringify({ interests: ids, id: userDetails.id }),
        token,
      )
        .then((res) => {
          setSuccess(true);
          setEnableSaveButton(false);
        })
        .catch((e) => setSuccess(false));
    };

    // Get all true ids.
    const trueInterests = interests.filter((i) => i.userSelected === true);
    const ids = trueInterests.map((i) => i.id);
    postUpdate(ids);
  };

  return (
    <div className="cf bg-white b--card ba br1 pa4 mb4">
      <h3 className="f3 blue-dark mt0 fw7 mb0 lh-solid">
        <FormattedMessage {...messages.interestsH3} />
      </h3>
      <p className="blue-grey ma0 mt2 mb3">
        <FormattedMessage {...messages.interestsLead} />
      </p>
      <InterestsList interests={interests} field={'userSelected'} changeSelect={changeSelect} />
      {success === true && (
        <span className="blue-dark bg-grey-light pa2 db">
          <FormattedMessage {...messages.interestsUpdateSuccess} />
        </span>
      )}
      {success === false && (
        <span className="bg-red white pa2 db">
          <FormattedMessage {...messages.interestsUpdateError} />
        </span>
      )}
      <Button
        onClick={updateInterests}
        className={`${
          enableSaveButton ? 'bg-blue-dark' : 'bg-grey-light'
        } white mv3 dib settings-width`}
        disabled={!enableSaveButton}
      >
        <FormattedMessage {...messages.save} />
      </Button>
    </div>
  );
}
