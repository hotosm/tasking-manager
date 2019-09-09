import React, { useRef, useState } from 'react';
import { useOnClickOutside } from '../../hooks/UseOnClickOutside';
import { ChevronUpIcon, ChevronDownIcon } from '../svgIcons';
import { Link } from '@reach/router';
import messages from './messages';
import { FormattedMessage, injectIntl, intlShape } from 'react-intl';

/* textComponent on IntlProvider is for <select> here, see codesandbox at https://github.com/facebook/react/issues/15513 */

const _OrderByPicker = props => {
  const [orderByOpen, setOrderByOpen] = useState(false);
  const navRef = useRef(null);

  const ascOrDesc = props.allQueryParams.orderByType;
  const orderByColumn = props.allQueryParams.orderBy;

  const anySortByActive = ascOrDesc || orderByColumn;
  const sortByCurrentActiveStyle = anySortByActive ? 'bg-red white' : 'bg-white blue-dark';

  const onChangeSortBy = n => {
    const value = n && n.target.value;
    props.setQuery(
      {
        ...props.allQueryParams,
        page: undefined,
        orderBy: value,
      },
      'pushIn',
    );
  };

  const onChangeSortByType = n => {
    props.setQuery(
      {
        ...props.allQueryParams,
        page: undefined,
        orderByType: n,
      },
      'pushIn',
    );
  };
  const intl = props.intl;

  useOnClickOutside(navRef, () => setOrderByOpen(false));

  const fullOrderByNav = (
    <nav
      ref={navRef}
      className={`di tc mt1 ba b--grey-light br1 fixed shadow-1 z-3 bg-white flex flex-column`}
    >
      <select onChange={onChangeSortBy} id="orderBy" className="ma3">
        <option value="">{intl.formatMessage({ ...messages.sortBy })} </option>
        <option value="id">{intl.formatMessage({ ...messages.sortBy_id })}</option>
        <option value="mapper_level">
          {intl.formatMessage({ ...messages.mappingDifficulty })}
        </option>
        <option value="priority">{intl.formatMessage({ ...messages.sortBy_priority })}</option>
        <option value="status">{intl.formatMessage({ ...messages.sortBy_status })}</option>
        <option value="last_updated">
          {intl.formatMessage({ ...messages.sortBy_last_updated })}
        </option>
        <option value="due_date">{intl.formatMessage({ ...messages.sortBy_due_date })}</option>
      </select>

      <div className="pa3">
        <button onClick={() => onChangeSortByType('ASC')} title="sort ascending">
          <ChevronUpIcon />{' '}
        </button>
        <button onClick={() => onChangeSortByType('DESC')} title="sort descending">
          <ChevronDownIcon />{' '}
        </button>
      </div>
    </nav>
  );
  const navButton = (
    <div className={`dib`}>
      <Link
        onClick={e => {
          setOrderByOpen(true);
          e.preventDefault();
          e.stopPropagation();
        }}
        to="./"
        className={`${props.linkCombo} 
        ${sortByCurrentActiveStyle}`}
      >
        <FormattedMessage {...messages.sortBy} />
      </Link>
      {orderByOpen && fullOrderByNav}
    </div>
  );

  return navButton;
};

_OrderByPicker.propTypes = {
  intl: intlShape.isRequired,
};

const OrderByPicker = injectIntl(_OrderByPicker);

export default OrderByPicker;
