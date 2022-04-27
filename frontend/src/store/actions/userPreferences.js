import * as safeStorage from '../../utils/safe_storage';

export const types = {
  SET_LOCALE: 'SET_LOCALE',
  SET_ACTION: 'SET_ACTION',
  TOGGLE_MAP: 'TOGGLE_MAP',
  TOGGLE_LIST_VIEW: 'TOGGLE_LIST_VIEW',
  TOGGLE_CARD_VIEW: 'TOGGLE_CARD_VIEW',
};

export function updateLocale(locale) {
  return {
    type: types.SET_LOCALE,
    locale: locale,
  };
}

export const setLocale = (locale) => (dispatch) => {
  safeStorage.setItem('locale', locale);
  dispatch(updateLocale(locale));
};
