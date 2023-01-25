import React from 'react';
import { FlagIcon } from '../svgIcons';
import { FormattedMessage } from 'react-intl';
import { useFavProjectAPI } from '../../hooks/UseFavProjectAPI';
import { navigate } from '@reach/router';
import { useSelector } from 'react-redux';
import messages from './messages';

export const AddToFavorites = (props) => {
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
      {isFav && props.children}
    </>
  );
};
