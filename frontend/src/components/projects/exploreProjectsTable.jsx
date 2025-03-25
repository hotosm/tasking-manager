import { Link } from 'react-router-dom';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { FormattedMessage } from 'react-intl';
import { formatDistance } from 'date-fns';
import { Tooltip } from 'react-tooltip';
import PropTypes from 'prop-types';

import { ProgressBar } from '../progressBar';
import { PriorityBox } from '../projectCard/priorityBox';
import messages from './messages';
import { CircleExclamationIcon } from '../svgIcons';
import './exploreProjectsTable.css';

const COLUMNS = [
  {
    accessorKey: 'name',
    header: () => (
      <span>
        <FormattedMessage {...messages.nameColumn} />
      </span>
    ),
    cell: ({ row }) => {
      return (
        <Link
          to={`/projects/${row.original.projectId}`}
          className="no-underline color-inherit"
          title={row.original.name}
        >
          {row.original.name}
        </Link>
      );
    },
  },
  {
    accessorKey: 'author',
    header: () => (
      <span>
        <FormattedMessage {...messages.authorColumn} />
      </span>
    ),
    cell: ({ row }) => {
      return row.original.author ? row.original.author : <span className="gray">--</span>;
    },
  },
  {
    accessorKey: 'organisationName',
    header: () => (
      <span>
        <FormattedMessage {...messages.organisationColumn} />
      </span>
    ),
  },
  {
    accessorKey: 'progress',
    header: () => (
      <span>
        <FormattedMessage {...messages.progressColumn} />
      </span>
    ),
    minSize: 130,
    cell: ({ row }) => {
      const tooltipContent = (
        <div>
          <p className="lh-copy ma0 white f7 fw4">
            <FormattedMessage
              {...messages['percentMapped']}
              values={{ n: <span className="fw8">{row.original.percentMapped}</span> }}
            />
          </p>
          <p className="lh-copy ma0 white f7 fw4">
            <FormattedMessage
              {...messages['percentValidated']}
              values={{ n: <span className="fw8">{row.original.percentValidated}</span> }}
            />
          </p>
        </div>
      );

      return (
        <div>
          <div data-tooltip-id={`project-${row.original.projectId}-progress`}>
            <ProgressBar
              firstBarValue={
                row.original.percentMapped > 0
                  ? Math.max(8, row.original.percentMapped)
                  : row.original.percentMapped
              }
              secondBarValue={
                row.original.percentValidated > 0
                  ? Math.max(8, row.original.percentValidated)
                  : row.original.percentValidated
              }
              height="half"
              small={false}
            />
          </div>
          <Tooltip id={`project-${row.original.projectId}-progress`} className="z-3">
            {tooltipContent}
          </Tooltip>
        </div>
      );
    },
  },
  {
    accessorKey: 'totalContributors',
    header: () => (
      <span>
        <FormattedMessage {...messages.contributorsColumn} />
      </span>
    ),
  },
  {
    accessorKey: 'priority',
    header: () => (
      <span>
        <FormattedMessage {...messages.priorityColumn} />
      </span>
    ),
    cell: ({ row }) => {
      return (
        <PriorityBox
          priority={row.original.priority}
          extraClasses="f7 pv1 ph2 dib"
          showIcon={!['URGENT', 'MEDIUM', 'LOW'].includes(row.original.priority)}
        />
      );
    },
  },
  {
    accessorKey: 'difficulty',
    header: () => (
      <span>
        <FormattedMessage {...messages.difficultyColumn} />
      </span>
    ),
    cell: ({ row }) => {
      const difficulty = row.original.difficulty;
      if (difficulty === 'EASY') return <div className="i green">Easy</div>;
      if (difficulty === 'MODERATE') return <div className="i orange">Moderate</div>;
      if (difficulty === 'CHALLENGING') return <div className="i red">Challenging</div>;
    },
  },
  {
    accessorKey: 'status',
    header: () => (
      <span>
        <FormattedMessage {...messages.statusColumn} />
      </span>
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      if (status === 'DRAFT') return <div className="orange">Draft</div>;
      if (status === 'PUBLISHED') return <div className="">Published</div>;
      if (status === 'ARCHIVED') return <div className="gray">Archived</div>;
    },
  },
  {
    accessorKey: 'location',
    header: () => (
      <span>
        <FormattedMessage {...messages.locationColumn} />
      </span>
    ),
    cell: ({ row }) => {
      if (!row.original?.country[0]) return null;
      return <span title={row.original.country[0]}>{row.original.country[0]}</span>;
    },
  },
  {
    accessorKey: 'lastUpdated',
    header: () => (
      <span>
        <FormattedMessage {...messages.lastUpdatedColumn} />
      </span>
    ),
    cell: ({ row }) => {
      if (!row.original.lastUpdated) return null;
      return `${formatDistance(new Date(row.original.lastUpdated), new Date())} ago`;
    },
  },
  {
    accessorKey: 'dueDate',
    header: () => (
      <span>
        <FormattedMessage {...messages.dueDateColumn} />
      </span>
    ),
    cell: ({ row }) => {
      if (!row.original.dueDate) return <span className="gray">--</span>;

      const dueDateObject = new Date(row.original.dueDate);
      return dueDateObject < new Date() ? (
        <span className="gray">Finished</span>
      ) : (
        <span>in {formatDistance(dueDateObject, new Date())}</span>
      );
    },
  },
];

export const ExploreProjectsTable = ({ projects, status }) => {
  const table = useReactTable({
    columns: COLUMNS,
    data: projects,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: 'onChange',
    columnResizeDirection: 'ltr',
  });

  const isEmpty = status !== 'pending' && status !== 'error' && projects.length === 0;

  return (
    <div className="overflow-auto">
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

                  {header.id !== 'dueDate' && (
                    <div
                      {...{
                        onDoubleClick: () => header.column.resetSize(),
                        onMouseDown: header.getResizeHandler(),
                        onTouchStart: header.getResizeHandler(),
                        className: `explore-projects-table-column-resizer ${
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
                  className={`f6 pr3 mw5 pl2 bb b--moon-gray ${
                    cell.column.id !== 'progress' ? 'truncate' : ''
                  }`} // Don't add truncate class to progress column as it shows a tooltip
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

      {isEmpty && (
        <div className="flex items-center justify-start pa4 gap-1 pl2">
          <CircleExclamationIcon className="red" width="20" height="20" />
          <p className="ma0">
            <FormattedMessage {...messages.projectsTableEmpty} />
          </p>
        </div>
      )}
    </div>
  );
};

ExploreProjectsTable.propTypes = {
  projects: PropTypes.arrayOf(PropTypes.object).isRequired,
  status: PropTypes.string.isRequired,
};
