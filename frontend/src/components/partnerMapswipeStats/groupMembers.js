import { FormattedMessage } from 'react-intl';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';

import { BanIcon, CircleExclamationIcon } from '../svgIcons';
import { PaginatorLine } from '../paginator';
import messages from './messages';
import './groupMembers.css';

const MOCK_DATA = [
  {
    user: 'map4life',
    totalSwipes: 12023,
    projectContributed: 'American Red Cross',
    timeSpent: '2 Months',
  },
  {
    user: 'PinkSky234',
    totalSwipes: 11984,
    projectContributed: 'American Red Cross',
    timeSpent: '1 Month',
  },
  {
    user: 'swiper55',
    totalSwipes: 3540,
    projectContributed: 'HOT',
    timeSpent: '3 Weeks',
  },
  {
    user: 'edelweiss93',
    totalSwipes: 1234,
    projectContributed: 'American Red Cross',
    timeSpent: '1 Week',
  },
  {
    user: 'mappy45',
    totalSwipes: 842,
    projectContributed: 'HOT',
    timeSpent: '2 Weeks',
  },
  {
    user: 'sup3rMap',
    totalSwipes: 325,
    projectContributed: 'American Red Cross',
    timeSpent: '5 Days',
  },
  {
    user: '4weeksmapping',
    totalSwipes: 74,
    projectContributed: 'HOT',
    timeSpent: '1 Day',
  },
];

const COLUMNS = [
  {
    accessorKey: 'user',
    header: () => (
      <span>
        <FormattedMessage {...messages.userColumn} />
      </span>
    ),
  },
  {
    accessorKey: 'totalSwipes',
    header: () => (
      <span>
        <FormattedMessage {...messages.totalSwipesColumn} />
      </span>
    ),
  },
  {
    accessorKey: 'projectContributed',
    header: () => (
      <span>
        <FormattedMessage {...messages.projectContributedColumn} />
      </span>
    ),
  },
  {
    accessorKey: 'timeSpent',
    header: () => (
      <span>
        <FormattedMessage {...messages.timeSpentColumn} />
      </span>
    ),
  },
];

export const GroupMembers = () => {
  const table = useReactTable({
    columns: COLUMNS,
    data: MOCK_DATA,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: 'onChange',
    columnResizeDirection: 'ltr',
  });

  const isEmpty = false;
  const isError = false;

  return (
    <div>
      <h3 className="f2 fw6 ttu barlow-condensed blue-dark mt0 pt2 mb4">
        <FormattedMessage {...messages.groupMembers} />
      </h3>
      <div className="bg-white br1 shadow-6">
        <div className="overflow-auto ph4 pv2">
          <table className="f6 w-100 center" cellSpacing="0">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      className="fw5 f6 bb bw1 b--moon-gray tl pv3 pr3 pl2 relative"
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{ width: header.getSize(), maxWidth: header.maxWidth }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}

                      {header.id !== 'timeSpent' && (
                        <div
                          {...{
                            onDoubleClick: () => header.column.resetSize(),
                            onMouseDown: header.getResizeHandler(),
                            onTouchStart: header.getResizeHandler(),
                            className: `partner-mapswipe-stats-column-resizer ${
                              table.options.columnResizeDirection === 'ltr' ? 'right-0' : ''
                            } ${header.column.getIsResizing() ? 'isResizing' : ''}`,
                          }}
                        />
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="lh-copy">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td
                      className="f6 pr3 mw5 pl2 bb b--moon-gray"
                      key={cell.id}
                      style={{
                        width: cell.column.getSize(),
                        minWidth: cell.column.columnDef.minSize,
                        maxWidth: cell.column.columnDef.size,
                        paddingTop: '0.75rem',
                        paddingBottom: '0.75rem',
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {isError ? (
            <div className="flex items-center justify-start pa4 gap-1 pl1">
              <BanIcon className="red" width="20" height="20" />
              <p className="ma0">
                <FormattedMessage {...messages.groupMembersTableError} />
              </p>
            </div>
          ) : null}

          {isEmpty && (
            <div className="flex items-center justify-start pa4 gap-1 pl2">
              <CircleExclamationIcon className="red" width="20" height="20" />
              <p className="ma0">
                <FormattedMessage {...messages.groupMembersTableEmpty} />
              </p>
            </div>
          )}
        </div>

        <div className="mt3">
          <PaginatorLine
            activePage={1}
            setPageFn={() => {}}
            lastPage={1}
            className="flex items-center justify-center pa4"
          />
        </div>
      </div>
    </div>
  );
};
