import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';

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
      label: <FormattedMessage {...messages.sortByEasy} />,
      value: 'difficulty.ASC',
      sort: 'difficulty',
      type: 'ASC',
    },
    {
      label: <FormattedMessage {...messages.sortByChallenging} />,
      value: 'difficulty.DESC',
      sort: 'difficulty',
      type: 'DESC',
    },
    {
      label: <FormattedMessage {...messages.sortByDueDateAsc} />,
      value: 'due_date.ASC',
      sort: 'due_date',
      type: 'ASC',
    },
    {
      label: <FormattedMessage {...messages.sortByPercentMappedDesc} />,
      value: 'percent_mapped.DESC',
      sort: 'percent_mapped',
      type: 'DESC',
    },
    {
      label: <FormattedMessage {...messages.sortByPercentValidatedDesc} />,
      value: 'percent_validated.DESC',
      sort: 'percent_validated',
      type: 'DESC',
    },
  ];

  const onSortSelect = (arr) =>
    props.setQuery(
      {
        ...props.allQueryParams,
        page: undefined,
        orderBy: arr[0].sort,
        orderByType: arr[0].type,
      },
      'pushIn',
    );

  return (
    <Dropdown
      onChange={onSortSelect}
      value={`${props.allQueryParams.orderBy}.${props.allQueryParams.orderByType}`}
      options={options}
      display={<FormattedMessage {...messages.sortBy} />}
      className={`ba b--tan bg-white mr3 v-mid pv2 br1 pl3 fw5 blue-dark ${props.className || ''}`}
    />
  );
}

OrderBySelector.propTypes = {
  className: PropTypes.string,
  setQuery: PropTypes.func.isRequired,
  allQueryParams: PropTypes.object.isRequired,
};
