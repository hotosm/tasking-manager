import { Dispatch } from 'redux';
import { setItem } from '../../utils/safe_storage';

export const types = {
  SET_LOCALE: 'SET_LOCALE',
  SET_ACTION: 'SET_ACTION',
  TOGGLE_MAP: 'TOGGLE_MAP',
  TOGGLE_LIST_VIEW: 'TOGGLE_LIST_VIEW',
  TOGGLE_CARD_VIEW: 'TOGGLE_CARD_VIEW',
  SET_EXPLORE_PROJECTS_TABLE_VIEW: 'SET_EXPLORE_PROJECTS_TABLE_VIEW',
  SET_EXPLORE_PROJECTS_CARD_VIEW: 'SET_EXPLORE_PROJECTS_CARD_VIEW',
} as const;

export function updateLocale(locale: string) {
  return {
    type: types.SET_LOCALE,
    locale: locale,
  };
}

export const setLocale = (locale: string) => (dispatch: Dispatch) => {
  setItem('locale', locale);
  dispatch(updateLocale(locale));
};
