import { FormattedMessage } from 'react-intl';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import ReactPlaceholder from 'react-placeholder';

import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import { BanIcon, CircleExclamationIcon } from '../svgIcons';
import { PaginatorLine } from '../paginator';
import messages from './messages';
import { GroupMembersPlaceholder } from './groupMembersPlaceholder';
import './groupMembers.css';

const COLUMNS = [
  {
    accessorKey: 'username',
    header: () => (
      <span>
        <FormattedMessage {...messages.userColumn} />
      </span>
    ),
  },
  {
    accessorKey: 'totalcontributions',
    header: () => (
      <span>
        <FormattedMessage {...messages.totalSwipesColumn} />
      </span>
    ),
  },
  {
    accessorKey: 'totalMappingProjects',
    header: () => (
      <span>
        <FormattedMessage {...messages.projectContributedColumn} />
      </span>
    ),
  },
  {
    accessorKey: 'totalcontributionTime',
    header: () => (
      <span>
        <FormattedMessage {...messages.timeSpentColumn} />
      </span>
    ),
  },
];

export const GroupMembers = () => {
  const { id: partnerPermalink } = useParams();

  const ROWS = 10;
  const [pageNumber, setPageNumber] = useState(0)

  const { isLoading, isError, data, isRefetching } = useQuery({
    queryKey: ['partners-mapswipe-general-statistics', partnerPermalink, pageNumber],
    queryFn: async () => {
      const response = await fetchLocalJSONAPI(
        `partners/${partnerPermalink}/general-statistics/?limit=${ROWS}&offset=${pageNumber * ROWS}`,
      );
      return response;
    },
  });

  const table = useReactTable({
    columns: COLUMNS,
    data: data?.members ?? [],
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: 'onChange',
    columnResizeDirection: 'ltr',
  });

  const isEmpty = false;

  return (
    <ReactPlaceholder customPlaceholder={<GroupMembersPlaceholder />} ready={!isLoading && !isRefetching}>
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
                            className: `partner-mapswipe-stats-column-resizer ${table.options.columnResizeDirection === 'ltr' ? 'right-0' : ''
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
            activePage={pageNumber + 1}
            setPageFn={(n) => setPageNumber(parseInt(n) - 1)}
            lastPage={Math.max(Math.ceil((data?.membersCount ?? 0) / ROWS), 1)}
            className="flex items-center justify-center pa4"
          />
        </div>
      </div>
    </ReactPlaceholder>
  );
};
