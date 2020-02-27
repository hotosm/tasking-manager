import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from '@reach/router';
import { FormattedMessage } from 'react-intl';

import messages from '../../views/messages';
import editMessages from '../projectEdit/messages';
import { UserAvatar } from './avatar';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import { PaginatorLine } from '../paginator';
import { SearchIcon, CloseIcon } from '../svgIcons';
import { Dropdown } from '../dropdown';
import { SettingsIcon, CheckIcon } from '../svgIcons';
import Popup from 'reactjs-popup';

const UserFilter = ({ filters, setFilters, updateFilters, intl }) => {
  const inputRef = useRef(null);

  return (
    <div>
      <FormattedMessage {...messages.enterUsername}>
        {msg => {
          return (
            <form className="relative">
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
                onChange={e => updateFilters('username', e.target.value)}
                placeholder={msg}
                className={'input-reset ba b--grey-light pa1 lh-copy db w-100'}
                style={{ textIndent: '30px' }}
                type="text"
                aria-describedby="name-desc"
              />

              <CloseIcon
                onClick={() => {
                  setFilters(p => {
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
  const roles = ['ALL', 'MAPPER', 'VALIDATOR', 'PROJECT_MANAGER', 'ADMIN'];

  const options = roles.map(role => {
    return { value: role, label: <FormattedMessage {...editMessages[`userRole${role}`]} /> };
  });

  return (
    <div>
      <Dropdown
        onAdd={() => {}}
        onRemove={() => {}}
        onChange={n => {
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

  const options = mapperLevels.map(l => {
    return { value: l, label: <FormattedMessage {...editMessages[`mapperLevel${l}`]} /> };
  });

  return (
    <div>
      <Dropdown
        onAdd={() => {}}
        onRemove={() => {}}
        onChange={n => {
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

export const SearchNav = ({ filters, setFilters }) => {
  const updateFilters = (field, value) => {
    setFilters(f => {
      return { ...f, [field]: value };
    });
  };

  return (
    <div className="w-100 mb3 flex items-center">
      <div className="fl w-20 mr2">
        <UserFilter filters={filters} setFilters={setFilters} updateFilters={updateFilters} />
      </div>
      <div className="mr3 tr">
        <MapperLevelFilter
          filters={filters}
          setFilters={setFilters}
          updateFilters={updateFilters}
        />
      </div>
      <div className="tr">
        <RoleFilter filters={filters} setFilters={setFilters} updateFilters={updateFilters} />
      </div>
    </div>
  );
};

export const UsersTable = ({ filters, setFilters }) => {
  const token = useSelector(state => state.auth.get('token'));
  const [response, setResponse] = useState(null);
  const userDetails = useSelector(state => state.auth.get('userDetails'));
  const [status, setStatus] = useState({ status: null, message: '' });

  useEffect(() => {
    const fetchUsers = async filters => {
      const url = `users/?${filters}`;
      const res = await fetchLocalJSONAPI(url, token);
      setResponse(res);
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
      .filter(v => v !== null)
      .join('&');

    fetchUsers(urlFilters);
  }, [filters, token, status]);

  if (!token) {
    return <Redirect to={'login'} noThrow />;
  }

  if (response === null) {
    return null;
  }

  return (
    <div className="w-100">
      <p className="f6 mt0">
        <FormattedMessage {...messages.totalUsers} values={{ total: response.pagination.total }} />
      </p>
      <div className="w-100 f5">
        <ul className="list pa0 ma0">
          {response.users.map(user => (
            <UserListCard
              user={user}
              key={user.id}
              token={token}
              username={userDetails.username}
              setStatus={setStatus}
            />
          ))}
        </ul>
        {response === null || response.pagination.total === 0 ? null : (
          <PaginatorLine
            activePage={filters.page}
            setPageFn={val =>
              setFilters(f => {
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

const UserEditMenu = ({ user, token, close, setStatus }) => {
  const roles = ['MAPPER', 'VALIDATOR', 'PROJECT_MANAGER', 'ADMIN', 'READ_ONLY'];
  const mapperLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
  const iconClass = 'h1 w1';

  const updateRole = (username, role, token, close) => {
    fetchLocalJSONAPI(`users/${username}/actions/set-role/${role}/`, token, 'PATCH').then(() => {
      close();
      setStatus({ success: true });
    });
  };

  const updateMapperLevel = (username, level, token, close) => {
    fetchLocalJSONAPI(`users/${username}/actions/set-level/${level}/`, token, 'PATCH').then(() => {
      close();
      setStatus({ success: true });
    });
  };

  return (
    <div className="w-100 f6 tl ph1">
      <div className="w-100 bb b--tan">
        <p className="b mv3">Set Role</p>
        {roles.map(r => {
          return (
            <div key={r} className="mv2 dim pointer w-100 flex items-center justify-between">
              <p onClick={() => updateRole(user.username, r, token, close)} className="ma0 pa0">
                <FormattedMessage {...editMessages[`userRole${r}`]} />
              </p>
              {r === user.role ? <CheckIcon className={iconClass} /> : null}
            </div>
          );
        })}
      </div>
      <div className="w-100">
        <p className="b mv3">Set mapper level</p>
        {mapperLevels.map(m => {
          return (
            <div key={m} className="mv2 dim pointer w-100 flex items-center justify-between">
              <p
                onClick={() => updateMapperLevel(user.username, m, token, close)}
                className="ma0 pa0"
              >
                <FormattedMessage {...editMessages[`mapperLevel${m}`]} />
              </p>
              {m === user.mappingLevel ? <CheckIcon className={iconClass} /> : null}
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
        <FormattedMessage {...editMessages[`mapperLevel${user.mappingLevel}`]} />
      </div>
      <div className="w-20 fl dib-ns dn tc">
        <FormattedMessage {...editMessages[`userRole${user.role}`]} />
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
            {close => (
              <UserEditMenu user={user} token={token} close={close} setStatus={setStatus} />
            )}
          </Popup>
        </div>
      )}
    </li>
  );
}
