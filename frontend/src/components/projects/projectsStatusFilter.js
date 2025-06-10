import { useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { useSelector } from 'react-redux';

import messages from './messages';
import { Dropdown } from '../dropdown';

const ALL_STATUSES = ['PUBLISHED', 'ARCHIVED', 'DRAFT'];
const ALL = 'all';

export const ProjectsStatusFilter = ({ setQuery, fullProjectsQuery }) => {
  const userDetails = useSelector((state) => state.auth.userDetails);
  const isAdmin = userDetails && userDetails.role === 'ADMIN';

  const dropdownOptions = [
    { label: <FormattedMessage {...messages.allprojects} />, value: ALL },
    { label: <FormattedMessage {...messages.published} />, value: 'PUBLISHED' },
    { label: <FormattedMessage {...messages.archived} />, value: 'ARCHIVED' },
  ];

  if (isAdmin) {
    dropdownOptions.push({ label: <FormattedMessage {...messages.draft} />, value: 'DRAFT' });
  }

  const handleStatusChange = useCallback(
    (selected) => {
      const value = selected && selected[0] && selected[0].value;
      // filter out `DRAFT` for non-admins
      const status = isAdmin ? ALL_STATUSES : ALL_STATUSES.filter((stat) => stat !== 'DRAFT');
      setQuery(
        {
          ...fullProjectsQuery,
          page: undefined,
          status: value === ALL ? status.join(',') : value,
        },
        'pushIn',
      );
    },
    [fullProjectsQuery, setQuery, isAdmin],
  );

  const statuses = isAdmin ? ALL_STATUSES : ALL_STATUSES.filter((stat) => stat !== 'DRAFT');

  return (
    <Dropdown
      onChange={handleStatusChange}
      value={
        fullProjectsQuery.status === statuses.join(',') ? ALL : fullProjectsQuery.status || 'any'
      }
      options={dropdownOptions}
      display="Project Status"
      className="ba b--tan bg-white mr3 f6 v-mid dn dib-ns pv2 br1 pl3 fw5 blue-dark"
    />
  );
};
