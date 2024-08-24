import React from 'react';
import { FormattedMessage } from 'react-intl';
import messages from './messages';
import { filters } from './inboxNav';

export function SelectAllNotifications({
  inboxQuery,
  totalNotifications,
  setSelected,
  isAllSelected,
  setIsAllSelected,
}) {
  const activeTabMsgId = filters.find(
    (filter) =>
      filter.isActiveConstraint !== 'All' &&
      inboxQuery?.types &&
      filter.isActiveConstraint.join(',') === inboxQuery.types.join(','),
  )?.messageId;

  const getButtonText = () => {
    return (
      <FormattedMessage
        {...messages.selectAll}
        values={{
          count: totalNotifications,
          activeTab: activeTabMsgId ? <FormattedMessage {...messages[activeTabMsgId]} /> : 'all',
        }}
      />
    );
  };
  return (
    <div className="pa3 mb2 bg-tan mw8 flex justify-center">
      {isAllSelected ? (
        <>
          <span>
            <FormattedMessage
              {...messages.allNotificationsSelected}
              values={{
                count: totalNotifications,
                activeTab: activeTabMsgId ? (
                  <FormattedMessage {...messages[activeTabMsgId]} />
                ) : (
                  'all'
                ),
              }}
            />
          </span>
          <button className="bw0 red fw5 pointer" onClick={() => setSelected([])}>
            <FormattedMessage {...messages.clearSelection} />
          </button>
        </>
      ) : (
        <>
          <span>
            <FormattedMessage {...messages.allPageNotificationsSelected} />
          </span>
          <button className="bw0 red fw5 pointer" onClick={() => setIsAllSelected(true)}>
            {getButtonText()}
          </button>
        </>
      )}
    </div>
  );
}
