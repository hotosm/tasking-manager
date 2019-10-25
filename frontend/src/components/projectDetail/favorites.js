import React from 'react';
import { FlagIcon } from '../svgIcons';
import { FormattedMessage } from 'react-intl';
import { useFavProjectAPI } from '../../hooks/UseFavProjectAPI';
import { navigate } from '@reach/router';
import { useSelector } from 'react-redux';
import messages from './messages';

export const AddToFavorites = props => {
  const userToken = useSelector(state => state.auth.get('token'));
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
        } input-reset dim base-font bg-white blue-dark button-reset f6 bn pn pointer`}
      >
        <FlagIcon className={`pt3 pr2 v-btm ${isLoading ? 'o-50' : ''} ${isFav ? 'red' : ''}`} />
        {isFav ? (
          <FormattedMessage {...messages.removeFromFavorites} />
        ) : (
          <FormattedMessage {...messages.addToFavorites} />
        )}
      </button>
      {isFav && props.children}
    </>
  );
};
