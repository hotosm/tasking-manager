import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { SearchNav, UsersTable } from '../components/user/list';
import { useSetTitleTag } from '../hooks/UseMetaTags';

export const UsersList = () => {
  useSetTitleTag('Manage users');
  const initialFilters = { level: 'ALL', role: 'ALL', username: '', page: 1 };
  const [filters, setFilters] = useState(initialFilters);

  return (
    <div className="pv4 blue-dark">
      <h3 className="barlow-condensed f2 ma0 v-mid dib ttu">
        <FormattedMessage {...messages.manageUsers} />
      </h3>
      <SearchNav filters={filters} setFilters={setFilters} initialFilters={initialFilters} />
      <div className="w-50-l w-70-m w-100 mb4">
        <UsersTable filters={filters} setFilters={setFilters} />
      </div>
    </div>
  );
};
