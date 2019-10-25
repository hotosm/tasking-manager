import * as safeStorage from '../../utils/safe_storage';

export const types = {
  SET_LOCALE: 'SET_LOCALE',
  TOGGLE_MAP: 'TOGGLE_MAP',
};

export function updateLocale(locale) {
  return {
    type: types.SET_LOCALE,
    locale: locale,
  };
}

export const setLocale = locale => dispatch => {
  safeStorage.setItem('locale', locale);
  dispatch(updateLocale(locale));
};
