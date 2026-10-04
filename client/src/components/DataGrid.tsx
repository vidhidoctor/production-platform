import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  align?: "left" | "right";
  /** Keeps the column visible while scrolling sideways (first column of wide grids). */
  sticky?: boolean;
  /** Cell class for a row, e.g. "zero" to mute empty values. */
  cellClass?: (row: T) => string | undefined;
  footer?: ReactNode;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
  maxHeight?: number | string;
}

export function DataGrid<T>({ columns, rows, rowKey, onRowClick, empty = "Nothing here yet.", maxHeight }: Props<T>) {
  if (rows.length === 0) return <div className="empty">{empty}</div>;
  const hasFooter = columns.some((c) => c.footer !== undefined);
  const cls = (c: Column<T>, row?: T) =>
    [c.align === "right" ? "num" : "", c.sticky ? "sticky-col" : "", row && c.cellClass ? c.cellClass(row) ?? "" : ""]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className="table-wrap" style={{ maxHeight }}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={cls(c)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className={onRowClick ? "clickable" : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((c) => (
                <td key={c.key} className={cls(c, row)}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {hasFooter && (
          <tfoot>
            <tr>
              {columns.map((c) => (
                <td key={c.key} className={cls(c)}>
                  {c.footer}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
