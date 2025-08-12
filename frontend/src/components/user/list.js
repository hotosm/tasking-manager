import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { FormattedMessage, useIntl } from 'react-intl';
import ReactPlaceholder from 'react-placeholder';
import toast from 'react-hot-toast';
import Popup from 'reactjs-popup';
import Select from 'react-select';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { formatDistance } from 'date-fns';

import messages from './messages';
import { UserAvatar } from './avatar';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import { PaginatorLine } from '../paginator';
import { SearchIcon, CloseIcon, SettingsIcon, CheckIcon, RefreshIcon } from '../svgIcons';
import { Dropdown } from '../dropdown';
import { nCardPlaceholders } from './usersPlaceholder';
import { OHSOME_STATS_TOPICS } from '../../config';
import { Button } from '../button';
import { ChevronUpIcon, ChevronDownIcon } from '../svgIcons';

const UserFilter = ({ filters, setFilters, updateFilters }) => {
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

const RoleFilter = ({ filters, updateFilters }) => {
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

const MapperLevelFilter = ({ filters, updateFilters, levels }) => {
  const intl = useIntl();

  const options = levels.map((l) => {
    return { value: l.id, label: l.name };
  });

  return (
    <div>
      <Select
        placeholder={intl.formatMessage(messages.mapperLevelALL)}
        options={options}
        onChange={(value) => updateFilters('level', value?.value)}
        value={options.find((o) => o.value === filters.level) || null}
      />
    </div>
  );
};

export const SearchNav = ({ filters, setFilters, initialFilters, levels }) => {
  const updateFilters = (field, value) => {
    setFilters((f) => {
      return { ...f, [field]: value };
    });
  };

  const clearFilters = () => {
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
          levels={levels}
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

export const UsersTable = ({ filters, setFilters, levels }) => {
  const token = useSelector((state) => state.auth.token);
  const [response, setResponse] = useState(null);
  const userDetails = useSelector((state) => state.auth.userDetails);
  const [status, setStatus] = useState({ status: null, message: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ sortState, setSortState ] = useState({});

  const handleSort = (topic) => {
    let newState = {};

    if (sortState[topic] === 'desc') {
      newState[topic] = 'asc';
    } else if (!sortState[topic]) {
      newState[topic] = 'desc';
    }

    setSortState(newState);
  };

  const getSort = () => {
    return Object.entries(sortState).map(([key, val]) => {
      return `&sort=${key}&sort_dir=${val}`;
    }).join('');
  };

  useEffect(() => {
    const fetchUsers = async (filters) => {
      setLoading(true);
      const sort = getSort();
      const url = `users/?${filters}${sort}`;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, token, status, sortState]);

  const handleStatsUpdate = (user) => {
    const endpoint = `users/${user.username}/actions/update-stats`;

    fetchLocalJSONAPI(endpoint, token, 'PATCH')
      .then(() => {
        setStatus({ success: true });
        toast.success(
          <FormattedMessage {...messages.statsUpdated} />,
        );
      })
      .catch(() =>
        toast.error(
          <FormattedMessage {...messages.failedUdatingStats} />,
        ),
      );
  };

  const handleApprove = (user) => {
    const endpoint = `users/${user.username}/actions/approve-level`;

    fetchLocalJSONAPI(endpoint, token, 'PATCH')
      .then(() => {
        setStatus({ success: true });
        toast.success(
          <FormattedMessage {...messages.levelApproved} />,
        );
      })
      .catch(() =>
        toast.error(
          <FormattedMessage {...messages.failedApprovingLevel} />,
        ),
      );
  };

  const COLUMNS = Array.prototype.concat.call(
    [
      {
        accessorKey: 'username',
        header: () => (<FormattedMessage {...messages.tableUsername} />),
        cell: ({row}) => <>
          <UserAvatar
            picture={row.original.pictureUrl}
            username={row.original.username}
            colorClasses="white bg-blue-grey"
          />
          <a
            className="blue-grey mr2 ml3 link"
            rel="noopener noreferrer"
            target="_blank"
            href={`/users/${row.original.username}`}
          >
            {row.original.username}
          </a>
        </>,
      },
      {
        id: 'level',
        accessorKey: 'mappingLevel',
        header: () => (<FormattedMessage {...messages.tableLevel} />),
      },
      {
        id: 'role',
        header: () => (<FormattedMessage {...messages.tableRole} />),
        cell: ({row}) => <FormattedMessage {...messages[`userRole${row.original.role}`]} />,
      }
    ],

    OHSOME_STATS_TOPICS.split(',').map((topic) => {
      return {
        id: `stats_${topic}`,
        accessorFn: (row) => {
          const topics = row.stats || {};

          return topics[topic] && topics[topic].toFixed(1);
        },
        header: () => <button
          onClick={() => handleSort(topic)}
          className="flex align-center bn bg-transparent pointer"
          style={{gap: ".5rem"}}
        >
          <FormattedMessage {...messages[`tableCol_${topic}`]} />
          {sortState[topic] === 'asc' ? <ChevronUpIcon /> : sortState[topic] === 'desc' ? <ChevronDownIcon /> : ''}
        </button>,
      };
    }),

    [
      {
        id: 'levelUpgrade',
        header: () => (<FormattedMessage {...messages.tableUpgrade} />),
        cell: ({row}) => {
          if (userDetails.username !== row.original.username) {
            // Can show approve UI only if viewer is not same as row
            if (row.original.user_has_voted) {
              return <FormattedMessage {...messages.alreadyVoted} />;
            } else if (row.original.requires_approval) {
              return <Button
                className="bg-black-90 white"
                onClick={() => handleApprove(row.original)}
              ><FormattedMessage {...messages.tableApprove} /></Button>;
            }
          }
        },
      },
      {
        id: 'statsLastUpdated',
        header: () => (<FormattedMessage {...messages.tableLastUpdated} />),
        cell: ({row}) => {
          if (row.original.statsLastUpdated) {
            return formatDistance(
              new Date(Date.parse(row.original.statsLastUpdated+'Z')),
              new Date(),
              { addSuffix: true },
            );
          } else {
            return <FormattedMessage {...messages.never} />;
          }
        },
      },
      {
        id: 'actions',
        header: () => (<FormattedMessage {...messages.tableActions} />),
        cell: ({row}) => (<>
          {userDetails.username !== row.original.username && <Popup
            trigger={
              <span>
                <SettingsIcon width="18px" height="18px" className="pointer hover-blue-grey mr3" />
              </span>
            }
            position="left center"
            closeOnDocumentClick
            className="user-popup"
          >
            {(close) => (
              <UserEditMenu
                user={row.original}
                token={token}
                close={close}
                setStatus={setStatus}
                levels={levels}
              />
            )}
          </Popup>}

          <button onClick={() => handleStatsUpdate(row.original)} className="bn pa0 bg-transparent pointer">
            <RefreshIcon width={18} height={18} />
          </button>
        </>)
      },
    ],
  );

  const table = useReactTable({
    columns: COLUMNS,
    data: response?.users || [],
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: 'onChange',
    columnResizeDirection: 'ltr',
  });

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
          <table className="f6 w-100 center" cellSpacing="0">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      className="fw5 f6 bb b bw1 b--moon-gray tl pv3 pr3 pl2 relative"
                      key={header.id}
                      colSpan={header.colSpan}
                    >
                      {header.isPlaceholder ? null : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td
                      className={"f6 pr3 pv3 mw5 pl2 bb b--moon-gray " + (row.index % 2 === 1 ? "bg-white-60" : "bg-white-90")}
                      key={cell.id}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
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

export const UserEditMenu = ({ user, token, close, setStatus, levels }) => {
  const roles = ['MAPPER', 'ADMIN', 'READ_ONLY'];
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
              attribute: "role",
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

  return <>
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
      {levels.map((level) => {
        return (
          <div
            key={level.id}
            role="button"
            onClick={() => updateAttribute('mapperLevel', level.name)}
            className="mv1 pv1 dim pointer w-100 flex items-center justify-between"
          >
            <p className="ma0">
              { level.name }
            </p>
            {level.name === user.mappingLevel ? <CheckIcon className={iconClass} /> : null}
          </div>
        );
      })}
    </div>
  </>;
};
