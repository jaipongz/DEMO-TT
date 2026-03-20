import { ReactNode } from 'react'
import { LookupSource } from './formConfig'

export type ListColumnType = 'text' | 'date' | 'datetime' | 'image'

export interface ListColumn {
  field: string
  name: string
  type?: ListColumnType
  width?: number // pixel width per column; defaults applied when computing minWidth
  sort?: boolean
  align?: 'left' | 'center' | 'right'
  render?: (value: any, row: any) => ReactNode
}

export interface ListFilterConfig {
  key: string
  label: string
  options?: Array<{ value: string | boolean; label: string }>
  lookup?: LookupSource
  deriveFromData?: boolean // when true, build options from dataset unique values
}

export interface ListConfig {
  title: string
  endpoint: string
  serverSide?: boolean // when true, list/search/filter/sort/pagination are delegated to backend
  pinEdgeColumns?: boolean // when true, selection/menu columns are pinned left/right while horizontal scrolling
  keywords?: string | string[] // shorthand for searchable fields
  filter?: string | string[] // legacy shorthand for search fields (prefer keywords)
  search?: {
    placeholder?: string
    fields: string[]
  }
  filters?: ListFilterConfig[]
  export?: boolean
  select?: boolean
  scroll?: boolean
  limit?: number // page size
  createHref?: string
  onRowOpen?: (row: any) => void | string // double-click handler; may return navigation href
  rowMenu?: boolean // show row action menu button when contextMenuBuilder is provided
  columns: ListColumn[]
  rowKey?: string
}

export function calculateTableMinWidth(config: ListConfig): number | undefined {
  if (!config.scroll) return undefined
  const defaultWidth = config.scroll ? 100 : 150
  const total = config.columns.reduce((sum, col) => sum + (col.width || defaultWidth), 0)
  const selectionWidth = config.select ? 48 : 0
  const menuWidth = config.rowMenu === false ? 0 : 48
  return total + selectionWidth + menuWidth
}
