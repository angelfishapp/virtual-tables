import React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useWindowVirtualizer, Virtualizer } from "@tanstack/react-virtual";

import { Person } from "./makeData";

type FixedHeightTableProps = {
  // The data to render
  data: any;
  // The columns to render
  columns: ColumnDef<Person>[];
};

/**
 * Renders full window height virtualised table
 */
export function WindowHeightTable({ data, columns }: FixedHeightTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  });

  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  // Get offset from top of window to ensure space is left for any
  // html elements above the table
  const tableOffsetRef = React.useRef(0);
  React.useLayoutEffect(() => {
    tableOffsetRef.current = tableContainerRef.current?.offsetTop ?? 0;
  }, []);

  const { rows } = table.getRowModel();
  const rowVirtualizer = useWindowVirtualizer({
    count: rows.length,
    scrollMargin: tableOffsetRef.current,
    estimateSize: () => 54,
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  console.log(
    virtualRows?.[0]?.start,
    rowVirtualizer.scrollOffset,
    tableOffsetRef.current
  );

  // Make header sticky
  const [isHeaderSticky, setIsHeaderSticky] = React.useState(false);
  React.useLayoutEffect(() => {
    const handleScroll = () => {
      const tableContainer = tableContainerRef.current;
      if (!tableContainer) return;
      const tableContainerRect = tableContainer.getBoundingClientRect();
      const isHeaderSticky = tableContainerRect.top < 0;
      setIsHeaderSticky(isHeaderSticky);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      ref={tableContainerRef}
      className="container"
      style={{ height: rowVirtualizer.getTotalSize() }}
    >
      <table>
        <thead className={isHeaderSticky ? "fixed-header" : undefined}>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        {...{
                          className: header.column.getCanSort()
                            ? "cursor-pointer select-none"
                            : "",
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: " 🔼",
                          desc: " 🔽",
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          <tr>
            <td
              style={{
                height: `${
                  virtualRows.length > 0
                    ? virtualRows?.[0]?.start - tableOffsetRef.current || 0
                    : 0
                }px`,
              }}
            />
          </tr>
          {virtualRows.map((virtualRow) => {
            const row = rows[virtualRow.index] as Row<Person>;
            return (
              <tr
                key={row.id}
                ref={rowVirtualizer.measureElement}
                data-index={row.index}
              >
                {row.getVisibleCells().map((cell) => {
                  return (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
