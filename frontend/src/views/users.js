import React, { useState } from 'react';
import messages from './messages';
import { FormattedMessage } from 'react-intl';
import { SearchNav, UsersTable } from '../components/userList';

export const UsersList = () => {
  const [filters, setFilters] = useState({ level: 'ALL', role: 'ALL', username: '', page: 1 });

  return (
    <div>
      <h3 className="barlow-condensed f2 ma0 pv3 mt1 v-mid dib ttu pl2 pl0-l">
        <FormattedMessage {...messages.userList} />
      </h3>
      <SearchNav filters={filters} setFilters={setFilters} />
      <div className="w-50 mb4">
        <UsersTable filters={filters} setFilters={setFilters} />
      </div>
    </div>
  );
};
