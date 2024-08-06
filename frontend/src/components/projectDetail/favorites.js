import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';

import { FlagIcon } from '../svgIcons';
import { useFavProjectAPI } from '../../hooks/UseFavProjectAPI';
import messages from './messages';

export const AddToFavorites = (props) => {
  const navigate = useNavigate();
  const userToken = useSelector((state) => state.auth.token);
  const [state, dispatchToggle] = useFavProjectAPI(false, props.projectId, userToken);
  const isFav = state.isFav;
  const isLoading = state.isLoading;

  return (
    <>
      <button
        type="button"
        onClick={() => (userToken ? dispatchToggle() : navigate('/login'))}
        className={`${
          !props.projectId ? 'dn' : ''
        } input-reset base-font bg-white blue-dark bn pointer flex nowrap items-center ml3`}
      >
        <FlagIcon
          className={`pr2 v-btm ${isLoading ? 'o-50' : ''} ${isFav ? 'red' : 'blue-grey'}`}
        />
        <span className="dn db-ns">
          {isFav ? (
            <FormattedMessage {...messages.removeFromFavorites} />
          ) : (
            <FormattedMessage {...messages.addToFavorites} />
          )}
        </span>
      </button>
    </>
  );
};
