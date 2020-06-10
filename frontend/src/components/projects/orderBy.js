import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { Dropdown } from '../dropdown';

/* textComponent on IntlProvider is for <select> here, see codesandbox at https://github.com/facebook/react/issues/15513 */

export function OrderBySelector(props) {
  const options = [
    {
      label: <FormattedMessage {...messages.sortByPriority} />,
      value: 'priority.ASC',
      sort: 'priority',
      type: 'ASC',
    },
    {
      label: <FormattedMessage {...messages.sortByMoreActive} />,
      value: 'last_updated.DESC',
      sort: 'last_updated',
      type: 'DESC',
    },
    {
      label: <FormattedMessage {...messages.sortByIdDesc} />,
      value: 'id.DESC',
      sort: 'id',
      type: 'DESC',
    },
    {
      label: <FormattedMessage {...messages.sortByIdAsc} />,
      value: 'id.ASC',
      sort: 'id',
      type: 'ASC',
    },
    {
      label: <FormattedMessage {...messages.sortByBeginner} />,
      value: 'mapper_level.ASC',
      sort: 'mapper_level',
      type: 'ASC',
    },
    {
      label: <FormattedMessage {...messages.sortByAdvanced} />,
      value: 'mapper_level.DESC',
      sort: 'mapper_level',
      type: 'DESC',
    },
  ];
  const onSortSelect = (arr) => {
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
      className={`ba b--grey-light bg-white mr1 v-mid pv2 ${props.className || ''}`}
    />
  );
}
