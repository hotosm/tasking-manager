import * as safeStorage from '../../utils/safe_storage';

export const types = {
  LANGUAGE: 'SET_LANGUAGE'
};


export function updateLanguage(language) {
  return {
    type: types.SET_LANGUAGE,
    language: language
  };
}

export const setLanguage = (language) => dispatch => {
  safeStorage.setItem('language', language);
  dispatch(updateLanguage(language));
};
