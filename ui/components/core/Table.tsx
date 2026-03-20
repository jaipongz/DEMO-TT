import React, { ReactNode } from 'react'

interface TableColumn {
  key: string
  label: string
  width?: number | string
  render?: (value: any, row: any) => ReactNode
  renderHeader?: () => ReactNode
  headerClassName?: string
  cellClassName?: string
  align?: 'left' | 'center' | 'right'
  sticky?: 'left' | 'right'
  sortable?: boolean
  sortDirection?: 'asc' | 'desc' | null
  onSort?: () => void
}

interface TableProps {
  columns: TableColumn[]
  data: any[]
  loading?: boolean
  onRowContextMenu?: (row: any, x: number, y: number) => void
  tableMinWidth?: number
  horizontalScroll?: boolean
  framed?: boolean
  onRowClick?: (row: any) => void
  onRowDoubleClick?: (row: any) => void
  footerRow?: ReactNode
  minHeight?: number | string
  emptyState?: ReactNode
  footerPinnedBottom?: boolean
}

export default function Table({ columns, data, loading, onRowContextMenu, tableMinWidth, horizontalScroll = true, framed = true, onRowClick, onRowDoubleClick, footerRow, minHeight, emptyState, footerPinnedBottom = false }: TableProps) {
  const resolvedMinHeight = typeof minHeight === 'number' ? `${minHeight}px` : minHeight
  const frameClass = framed ? 'card' : ''

  const stickyHeaderClass = (sticky?: 'left' | 'right') => {
    if (sticky === 'left') return 'sticky left-0 z-10'
    if (sticky === 'right') return 'sticky right-0 z-10'
    return ''
  }

  const stickyCellClass = (sticky?: 'left' | 'right') => {
    if (sticky === 'left') return 'sticky left-0 z-[1] bg-transparent group-hover:bg-[rgba(31,75,153,0.04)]'
    if (sticky === 'right') return 'sticky right-0 z-[1] bg-transparent group-hover:bg-[rgba(31,75,153,0.04)]'
    return ''
  }

  if (loading) {
    return (
      <div
        className={`${frameClass} p-6 text-center text-[color:var(--text-muted)]`}
        style={resolvedMinHeight ? { minHeight: resolvedMinHeight } : undefined}
      >
        Loading...
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className={`${frameClass} flex flex-col`} style={resolvedMinHeight ? { minHeight: resolvedMinHeight } : undefined}>
        <div className="p-6 text-center text-[color:var(--text-muted)] flex items-center justify-center flex-1">
          {emptyState || 'No data found'}
        </div>
        {footerRow && footerPinnedBottom && (
          <div className="mt-auto border-t border-[color:var(--border)] px-4 py-3">
            {footerRow}
          </div>
        )}
      </div>
    )
  }

  const tableStyle: React.CSSProperties = {
    width: '100%',
    tableLayout: 'fixed',
    ...(tableMinWidth ? { minWidth: `${tableMinWidth}px` } : {}),
  }

  const getWidthStyle = (width?: number | string): React.CSSProperties | undefined => {
    if (width === undefined) return undefined
    if (typeof width === 'number') return { width: `${width}px` }
    return { width }
  }

  return (
    <div className={`${frameClass} flex flex-col`} style={resolvedMinHeight ? { minHeight: resolvedMinHeight } : undefined}>
      <div className={`${horizontalScroll ? 'overflow-x-auto' : 'overflow-x-hidden'} flex-1`}>
      <table style={tableStyle}>
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className={`text-sm font-semibold text-[color:var(--text-muted)] ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'} ${stickyHeaderClass(col.sticky)} ${col.headerClassName || ''}`}
                style={getWidthStyle(col.width)}
              >
                {col.sortable && col.onSort ? (
                  <button
                    type="button"
                    onClick={col.onSort}
                    className="inline-flex items-center gap-1 hover:text-[color:var(--text)]"
                    aria-label={`Sort by ${col.label}`}
                  >
                    <span>{col.renderHeader ? col.renderHeader() : col.label}</span>
                    <span className="text-[10px]">
                      {col.sortDirection === 'asc' ? '▲' : col.sortDirection === 'desc' ? '▼' : '↕'}
                    </span>
                  </button>
                ) : (
                  col.renderHeader ? col.renderHeader() : col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="select-none">
          {data.map((row, idx) => (
            <tr
              key={idx}
              onClick={() => onRowClick?.(row)}
              onContextMenu={e => {
                e.preventDefault()
                onRowContextMenu?.(row, e.clientX, e.clientY)
              }}
              onDoubleClick={() => onRowDoubleClick?.(row)}
              className="group cursor-context-menu transition-colors"
            >
              {columns.map(col => (
                <td
                  key={col.key}
                  className={`align-middle whitespace-normal [overflow-wrap:anywhere] ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'} ${stickyCellClass(col.sticky)} ${col.cellClassName || ''}`}
                  style={getWidthStyle(col.width)}
                >
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footerRow && !footerPinnedBottom && (
          <tfoot>
            <tr>
              <td colSpan={Math.max(1, columns.length)} className="px-4 py-3 border-b-0">
                {footerRow}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
      </div>
      {footerRow && footerPinnedBottom && (
        <div className="mt-auto border-t border-[color:var(--border)] px-4 py-3">
          {footerRow}
        </div>
      )}
    </div>
  )
}
