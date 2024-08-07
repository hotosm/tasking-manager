import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { FormattedMessage } from 'react-intl';
import { formatDistance } from 'date-fns';

import { ProgressBar } from '../progressBar';
import { PriorityBox } from '../projectCard/priorityBox';
import messages from './messages';
import './exploreProjectsTable.css';

export const ExploreProjectsTable = ({ projects }) => {
  const table = useReactTable({
    // columns: COLUMNS,
    data: projects,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: 'onChange',
    columnResizeDirection: 'ltr',
  });

  return (
    <div className="overflow-auto">
      <table className="f6 w-100 center" cellSpacing="0">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  className="fw4 f5 bb bw1 b--moon-gray tl pv3 pr3 pl2 relative"
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
            <tr key={row.id} className="stripe">
              {row.getVisibleCells().map((cell) => (
                <td
                  className={`pv3 f5 pr3 mw5 pl2 ${cell.column.id !== 'progress' && 'truncate'}`} // Don't add truncate class to progress column as it shows a tooltip
                  key={cell.id}
                  style={{
                    width: cell.column.getSize(),
                    minWidth: cell.column.columnDef.minSize,
                    maxWidth: cell.column.columnDef.size,
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
