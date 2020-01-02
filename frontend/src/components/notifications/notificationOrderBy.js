import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { Dropdown } from '../dropdown';

export function NotificationOrderBySelector(props) {
  const options = [
    {
      label: <FormattedMessage {...messages.sortByRead} />,
      value: 'read.DESC',
      sort: 'read',
      type: 'DESC',
    },
    {
      label: <FormattedMessage {...messages.sortByDateDesc} />,
      value: 'date.DESC',
      sort: 'date',
      type: 'DESC',
    },
    {
      label: <FormattedMessage {...messages.sortByDateAsc} />,
      value: 'date.ASC',
      sort: 'date',
      type: 'ASC',
    },
    {
      label: <FormattedMessage {...messages.sortByIdDesc} />,
      value: 'projects.DESC',
      sort: 'projects',
      type: 'DESC',
    },
    {
      label: <FormattedMessage {...messages.sortByIdAsc} />,
      value: 'projects.ASC',
      sort: 'projects',
      type: 'ASC',
    },
  ];
  const onSortSelect = arr => {
    if (arr.length === 1) {
      props.setQuery(
        {
          ...props.allQueryParams,
          page: undefined,
          orderBy: arr[0].sort,
          orderByType: arr[0].type,
        },
        'pushIn',
      );
    } else if (arr.length > 1) {
      throw new Error('filter select array is bigger.');
    }
  };
  return (
    <Dropdown
      onAdd={() => {}}
      onRemove={() => {}}
      onChange={onSortSelect}
      value={`${props.allQueryParams.orderBy}.${props.allQueryParams.orderByType}` || []}
      options={options}
      display={<FormattedMessage {...messages.sortBy} />}
      className={`ba b--grey-light bg-white mr1 f6 v-mid pv2 ${props.className || ''}`}
    />
  );
}
