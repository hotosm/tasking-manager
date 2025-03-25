import { FormattedMessage, useIntl } from 'react-intl';
import { Dropdown } from '../dropdown';
import messages from './messages';

export default function MyTasksOrderDropdown({ className, setQuery, allQueryParams }: {
  className?: string;
  setQuery: Function;
  allQueryParams: unknown;
}) {
  const intl = useIntl();
  const options = [
    {
      label: intl.formatMessage(messages.recentlyEdited),
      value: '-action_date',
    },
    {
      label: intl.formatMessage(messages.projectId),
      value: '-project_id',
    },
  ];

  const onSortSelect = (arr: unknown[]) => {
    setQuery(
      {
        // @ts-expect-error TS Migrations
        ...allQueryParams,
        page: undefined,
        // @ts-expect-error TS Migrations
        orderBy: arr[0].value,
      },
      'pushIn',
    );
  }

  return (
    <Dropdown
      onChange={onSortSelect}
      options={options}
      // @ts-expect-error TS Migrations
      value={`${allQueryParams.orderBy}` || []}
      display={<FormattedMessage {...messages.sortBy} />}
      className={`ba b--grey-light bg-white mr1 v-mid pv2 ${className || ''}`}
    />
  );
}
