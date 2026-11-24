import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import AsyncSelect from 'react-select/async';

import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';

// wait for the user to stop typing before querying the API
export const USER_SEARCH_DELAY = 1000;

export function useUserSearchOptions() {
  const token = useSelector((state) => state.auth.token);
  return useCallback(
    (inputValue) =>
      new Promise((resolve) => {
        setTimeout(async () => {
          try {
            const result = await fetchLocalJSONAPI(
              `users/?username=${encodeURIComponent(inputValue)}`,
              token,
            );
            resolve(result.users);
          } catch (e) {
            resolve([]);
          }
        }, USER_SEARCH_DELAY);
      }),
    [token],
  );
}

/**
 * react-select AsyncSelect that searches users by username (GET users/?username=).
 * Options are the API's user objects ({ id, username, pictureUrl, ... }). Any
 * react-select prop (isMulti, placeholder, onChange, ...) can be passed through.
 */
export function UserSearchSelect(props) {
  const loadOptions = useUserSearchOptions();
  return (
    <AsyncSelect
      classNamePrefix="react-select"
      cacheOptions
      getOptionLabel={(option) => option.username}
      getOptionValue={(option) => option.username}
      loadOptions={loadOptions}
      {...props}
    />
  );
}
