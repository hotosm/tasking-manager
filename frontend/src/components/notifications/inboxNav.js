import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import contributionsMessages from '../contributions/messages';
import { useInboxQueryParams, stringify } from '../../hooks/UseInboxQueryAPI';

import { ProjectSearchBox } from '../projects/projectSearchBox';
import { NotificationOrderBySelector } from './notificationOrderBy';

export const filters = [
  {
    messageId: 'all',
    isActiveConstraint: 'All',
    to: '?orderBy=date&orderByType=desc&page=1&pageSize=10',
  },
  {
    messageId: 'messages',
    isActiveConstraint: ['3', '1', '6', '7'],
    to: '?orderBy=date&orderByType=desc&page=1&pageSize=10&types=3,1,6,7',
  },
  {
    messageId: 'projects',
    isActiveConstraint: ['2', '9', '10'],
    to: '?orderBy=date&orderByType=desc&page=1&pageSize=10&types=2,9,10',
  },
  {
    messageId: 'tasks',
    isActiveConstraint: ['8', '4', '5'],
    to: '?orderBy=date&orderByType=desc&page=1&pageSize=10&types=8,4,5',
  },
  {
    messageId: 'teams',
    isActiveConstraint: ['6', '7', '11'],
    to: '?orderBy=date&orderByType=desc&page=1&pageSize=10&types=6,7,11',
  },
];

const isActiveButton = (buttonName, projectQuery) => {
  const allBoolean = projectQuery.types === undefined;
  if (
    JSON.stringify(projectQuery['types']) === JSON.stringify(buttonName) ||
    (buttonName === 'All' && allBoolean)
  ) {
    return 'bg-blue-light grey-light white';
  } else {
    return 'bg-white blue-grey';
  }
};

export const InboxNavMini = ({ setPopoutFocus }) => {
  const unreadNotificationCount = useSelector((state) => state.notifications.unreadCount);
  return (
    /* mb1 mb2-ns (removed for map, but now small gap for more-filters) */
    <header className="notifications-header">
      <div className="w-100 flex justify-between">
        <h3 className="f4 fw7 ma0 f125">
          <FormattedMessage {...messages.notifications} />
        </h3>
        {unreadNotificationCount > 0 && (
          <Link
            to="/inbox?orderBy=read&orderByType=DESC"
            onClick={(e) => {
              setPopoutFocus(false);
            }}
          >
            <div className="flex justify-between items-center fr br2 bg-red f7 lh-solid white ph2 pv1">
              {unreadNotificationCount === 1 ? (
                <FormattedMessage {...messages.oneNewNotification} />
              ) : (
                <FormattedMessage
                  {...messages.unreadNotifications}
                  values={{ n: unreadNotificationCount }}
                />
              )}
            </div>
          </Link>
        )}
      </div>
    </header>
  );
};
export const InboxNavMiniBottom = (props) => {
  return (
    /* mb1 mb2-ns (removed for map, but now small gap for more-filters) */
    <footer className={`relative h2 w-100 ${props.className || ''}`}>
      <Link
        className="absolute flex items-center justify-center hover-darken tc pv2 w-100 b--grey-light bg-red white f5 no-underline br2 br--bottom"
        to="/inbox"
        onClick={(e) => {
          props.setPopoutFocus(false);
        }}
        style={{ height: '3rem' }}
      >
        {props.msgCount ? (
          <FormattedMessage {...messages.viewAll} />
        ) : (
          <FormattedMessage {...messages.goToNotifications} />
        )}
      </Link>
    </footer>
  );
};

export const InboxNav = (props) => {
  const [inboxQuery, setInboxQuery] = useInboxQueryParams();

  const linkCombo = 'link ph3 f6 pv2 shadow-3 fw5 br1';
  const notAnyFilter = !stringify(inboxQuery);

  return (
    <header className="w-100">
      <h3 className="mb2 f2 ttu barlow-condensed fw5 ma0">
        <FormattedMessage {...messages.notifications} />
      </h3>
      <div className="dib lh-copy w-100 mb3">
        <FormattedMessage {...contributionsMessages.searchProject}>
          {(msg) => {
            return (
              <ProjectSearchBox
                className="dib fl mr2"
                setQuery={setInboxQuery}
                fullProjectsQuery={inboxQuery}
                placeholder={msg}
                searchField={'project'}
              />
            );
          }}
        </FormattedMessage>
        <NotificationOrderBySelector
          className={`mt1 mt2-ns`}
          setQuery={setInboxQuery}
          allQueryParams={inboxQuery}
        />
        {!notAnyFilter && (
          <Link to="./" className="red link ph3 f6 v-mid pv2 mh1 mt1 mt2-ns dib">
            <FormattedMessage {...messages.clearFilters} />
          </Link>
        )}
      </div>
      <div className="flex flex-wrap">
        {filters.map((filter) => (
          <Link
            key={filter.messageId}
            to={filter.to}
            className={`di di-m mr2 mv2 ${isActiveButton(
              filter.isActiveConstraint,
              inboxQuery,
            )} ${linkCombo}`}
          >
            <FormattedMessage {...messages[filter.messageId]} />
          </Link>
        ))}
      </div>
      {props.children}
    </header>
  );
};
