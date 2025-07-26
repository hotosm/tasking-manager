import { useState, useEffect } from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { SearchNav, UsersTable } from '../components/user/list';
import { useSetTitleTag } from '../hooks/UseMetaTags';
import { fetchLocalJSONAPI } from '../network/genericJSONRequest';

export const UsersList = () => {
  useSetTitleTag('Manage users');
  const initialFilters = { level: 'ALL', role: 'ALL', username: '', page: 1 };
  const [filters, setFilters] = useState(initialFilters);
  const [levels, setLevels] = useState([]);

  useEffect(() => {
    (async () => {
      const res = await fetchLocalJSONAPI(`levels/`);

      setLevels(res.levels);
    })();
  }, []);

  return (
    <div className="pv4 blue-dark">
      <h3 className="barlow-condensed f2 ma0 v-mid dib ttu">
        <FormattedMessage {...messages.manageUsers} />
      </h3>
      <SearchNav
        filters={filters}
        setFilters={setFilters}
        initialFilters={initialFilters}
        levels={levels}
      />
      <div className="w-100 mb4">
        <UsersTable filters={filters} setFilters={setFilters} levels={levels} />
      </div>
    </div>
  );
};
