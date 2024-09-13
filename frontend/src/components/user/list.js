import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import ReactPlaceholder from 'react-placeholder';
import toast from 'react-hot-toast';
import Popup from 'reactjs-popup';

import messages from './messages';
import { UserAvatar } from './avatar';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import { PaginatorLine } from '../paginator';
import { SearchIcon, CloseIcon, SettingsIcon, CheckIcon } from '../svgIcons';
import { Dropdown } from '../dropdown';
import { nCardPlaceholders } from './usersPlaceholder';

const UserFilter = ({ filters, setFilters, updateFilters, intl }) => {
  const inputRef = useRef(null);

  return (
    <div>
      <FormattedMessage {...messages.enterUsername}>
        {(msg) => {
          return (
            <form
              className="relative"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <div>
                <SearchIcon
                  onClick={() => inputRef.current.focus()}
                  className={`absolute grey-light pl2 pt2`}
                />
              </div>
              <input
                id="name"
                ref={inputRef}
                autoComplete="off"
                value={filters.username !== '' ? filters.username : ''}
                onChange={(e) => updateFilters('username', e.target.value)}
                placeholder={msg}
                className={'input-reset ba b--grey-light pa1 lh-copy db w-100'}
                style={{ textIndent: '30px' }}
                type="text"
                aria-describedby="name-desc"
              />

              <CloseIcon
                onClick={() => {
                  setFilters((p) => {
                    return { ...p, username: '' };
                  });
                }}
                className={`absolute w1 h1 top-0 pt2 pointer pr2 right-0 red ${
                  filters.username ? '' : 'dn'
                }`}
              />
            </form>
          );
        }}
      </FormattedMessage>
    </div>
  );
};

const RoleFilter = ({ filters, setFilters, updateFilters }) => {
  const roles = ['ALL', 'MAPPER', 'ADMIN', 'READ_ONLY'];

  const options = roles.map((role) => {
    return { value: role, label: <FormattedMessage {...messages[`userRole${role}`]} /> };
  });

  return (
    <div>
      <Dropdown
        onChange={(n) => {
          const value = n && n[0] && n[0].value;
          updateFilters('role', value);
        }}
        options={options}
        value={filters.role}
        className={'ba b--grey-light bg-white mr1 f6 v-mid pv2 fl mt1 br1 f5 pointer'}
      />
    </div>
  );
};

const MapperLevelFilter = ({ filters, setFilters, updateFilters }) => {
  const mapperLevels = ['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

  const options = mapperLevels.map((l) => {
    return { value: l, label: <FormattedMessage {...messages[`mapperLevel${l}`]} /> };
  });

  return (
    <div>
      <Dropdown
        onChange={(n) => {
          const value = n && n[0] && n[0].value;
          updateFilters('level', value);
        }}
        options={options}
        value={filters.level}
        className={'ba b--grey-light bg-white mr1 f6 v-mid pv2 fl mt1 br1 f5 pointer'}
      />
    </div>
  );
};

export const SearchNav = ({ filters, setFilters, initialFilters }) => {
  const updateFilters = (field, value) => {
    setFilters((f) => {
      return { ...f, [field]: value };
    });
  };

  const clearFilters = (e) => {
    setFilters(initialFilters);
  };

  return (
    <div className="w-100 mb3 flex items-center">
      <div className="fl w-20 mr3">
        <UserFilter filters={filters} setFilters={setFilters} updateFilters={updateFilters} />
      </div>
      <div className="mr3 tr">
        <MapperLevelFilter
          filters={filters}
          setFilters={setFilters}
          updateFilters={updateFilters}
        />
      </div>
      <div className="tr mr3">
        <RoleFilter filters={filters} setFilters={setFilters} updateFilters={updateFilters} />
      </div>
      {(filters.username || filters.level !== 'ALL' || filters.role !== 'ALL') && (
        <div className="tr red pointer" onClick={clearFilters}>
          <FormattedMessage {...messages.clearFilters} />
        </div>
      )}
    </div>
  );
};

export const UsersTable = ({ filters, setFilters }) => {
  const token = useSelector((state) => state.auth.token);
  const [response, setResponse] = useState(null);
  const userDetails = useSelector((state) => state.auth.userDetails);
  const [status, setStatus] = useState({ status: null, message: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async (filters) => {
      setLoading(true);
      const url = `users/?${filters}`;
      fetchLocalJSONAPI(url, token)
        .then((res) => {
          setResponse(res);
          setLoading(false);
        })
        .catch((err) => setError(err));
    };

    // Filter elements according to logic.
    const urlFilters = Object.entries(filters)
      .map(([key, val]) => {
        if (key === 'role' || key === 'level') {
          if (val !== 'ALL') {
            return `${key}=${val}`;
          } else {
            return null;
          }
        }

        if (val !== '') {
          return `${key}=${val}`;
        }
        return null;
      })
      .filter((v) => v !== null)
      .join('&');

    fetchUsers(urlFilters);
  }, [filters, token, status]);

  return (
    <div className="w-100">
      {response?.users && (
        <p className="f6 mt0">
          <FormattedMessage
            {...messages.totalUsers}
            values={{ total: response.pagination.total }}
          />
        </p>
      )}
      <div className="w-100 f5">
        <ReactPlaceholder
          showLoadingAnimation={true}
          customPlaceholder={nCardPlaceholders(4)}
          delay={10}
          ready={!loading && !error}
        >
          <ul className="list pa0 ma0">
            {response?.users.map((user) => (
              <UserListCard
                user={user}
                key={user.id}
                token={token}
                username={userDetails.username}
                setStatus={setStatus}
              />
            ))}
          </ul>
        </ReactPlaceholder>
        {response === null || response.pagination.total === 0 ? null : (
          <PaginatorLine
            activePage={filters.page}
            setPageFn={(val) =>
              setFilters((f) => {
                return { ...f, page: val };
              })
            }
            lastPage={response.pagination.pages}
            className="pv3 tr"
          />
        )}
      </div>
    </div>
  );
};

export const UserEditMenu = ({ user, token, close, setStatus }) => {
  const roles = ['MAPPER', 'ADMIN', 'READ_ONLY'];
  const mapperLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
  const iconClass = 'h1 w1 red';

  const updateAttribute = (attribute, attributeValue) => {
    const endpoint = {
      role: `users/${user.username}/actions/set-role/${attributeValue}/`,
      mapperLevel: `users/${user.username}/actions/set-level/${attributeValue}/`,
    };

    fetchLocalJSONAPI(endpoint[attribute], token, 'PATCH')
      .then(() => {
        close();
        setStatus({ success: true });
        toast.success(
          <FormattedMessage
            {...messages.userAttributeUpdationSuccess}
            values={{
              attribute,
            }}
          />,
        );
      })
      .catch(() =>
        toast.error(
          <FormattedMessage
            {...messages.userAttributeUpdationFailure}
            values={{
              attribute,
            }}
          />,
        ),
      );
  };

  return (
    <div className="w-100 f6 tl ph1">
      <div className="w-100 bb b--tan">
        <p className="b mv3">
          <FormattedMessage {...messages.setRole} />
        </p>
        {roles.map((role) => {
          return (
            <div
              key={role}
              role="button"
              onClick={() => updateAttribute('role', role)}
              className="mv1 pv1 dim pointer w-100 flex items-center justify-between"
            >
              <p className="ma0">
                <FormattedMessage {...messages[`userRole${role}`]} />
              </p>
              {role === user.role ? <CheckIcon className={iconClass} /> : null}
            </div>
          );
        })}
      </div>
      <div className="w-100">
        <p className="b mv3">
          <FormattedMessage {...messages.setLevel} />
        </p>
        {mapperLevels.map((level) => {
          return (
            <div
              key={level}
              role="button"
              onClick={() => updateAttribute('mapperLevel', level)}
              className="mv1 pv1 dim pointer w-100 flex items-center justify-between"
            >
              <p className="ma0">
                <FormattedMessage {...messages[`mapperLevel${level}`]} />
              </p>
              {level === user.mappingLevel ? <CheckIcon className={iconClass} /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export function UserListCard({ user, token, username, setStatus }: Object) {
  const [isHovered, setHovered] = useState(false);

  return (
    <li
      key={user.username}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`bg-white cf flex items-center pa3 ba mb1 b--grey-light blue-dark ${
        isHovered ? 'shadow-4' : ''
      }`}
    >
      <div className="w-50-ns w-100 fl">
        <UserAvatar
          picture={user.pictureUrl}
          username={user.username}
          colorClasses="white bg-blue-grey"
        />
        <a
          className="blue-grey mr2 ml3 link"
          rel="noopener noreferrer"
          target="_blank"
          href={`/users/${user.username}`}
        >
          {user.username}
        </a>
      </div>
      <div className="w-20 fl dib-ns dn tc">
        <FormattedMessage {...messages[`mapperLevel${user.mappingLevel}`]} />
      </div>
      <div className="w-20 fl dib-ns dn tc">
        <FormattedMessage {...messages[`userRole${user.role}`]} />
      </div>

      {username === user.username ? null : (
        <div className="w-10 fl tr">
          <Popup
            trigger={
              <span>
                <SettingsIcon width="18px" height="18px" className="pointer hover-blue-grey" />
              </span>
            }
            position="right center"
            closeOnDocumentClick
            className="user-popup"
          >
            {(close) => (
              <UserEditMenu user={user} token={token} close={close} setStatus={setStatus} />
            )}
          </Popup>
        </div>
      )}
    </li>
  );
}
