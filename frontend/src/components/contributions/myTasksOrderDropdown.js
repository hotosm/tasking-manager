import { FormattedMessage } from 'react-intl';
import { Dropdown } from '../dropdown';
import messages from './messages';

export default function MyTasksOrderDropdown({ className, setQuery, allQueryParams }) {
  const options = [
    {
      label: <FormattedMessage {...messages.recentlyEdited} />,
      value: '-action_date',
    },
    {
      label: <FormattedMessage {...messages.projectId} />,
      value: '-project_id',
    },
  ];

  const onSortSelect = (arr) =>
    setQuery(
      {
        ...allQueryParams,
        page: undefined,
        orderBy: arr[0].value,
      },
      'pushIn',
    );

  return (
    <Dropdown
      onChange={onSortSelect}
      options={options}
      value={`${allQueryParams.orderBy}` || []}
      display={<FormattedMessage {...messages.sortBy} />}
      className={`ba b--grey-light bg-white mr1 v-mid pv2 ${className || ''}`}
    />
  );
}
