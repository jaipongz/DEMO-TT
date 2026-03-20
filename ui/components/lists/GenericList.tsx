import { MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import { useSWRConfig } from 'swr'
import Link from 'next/link'
import { api } from '../../utils/api'
import Table from '../core/Table'
import SearchBar from '../core/SearchBar'
import FilterBar from '../core/FilterBar'
import CustomSelect from '../core/CustomSelect'
import ContextMenu, { ContextMenuItem } from '../core/ContextMenu'
import OperationErrorPage, { extractApiErrorMessage } from '../core/OperationErrorPage'
import ConfirmDialog from '../core/ConfirmDialog'
import Toast from '../core/Toast'
import { calculateTableMinWidth, ListConfig, ListColumn } from '../../types/listConfig'
import { langLookup } from '../../config/core'
import type { SiteSettings } from '../../types/siteSettings'
import { fetchLookupOptions } from '../../utils/lookup'
import { getTimezoneOffsetLabel } from '../../utils/timezone'
import { useAuth } from '../../context/AuthContext'
import { hasModuleAction, inferActionFromLabel, resolveModuleKey } from '../../utils/permissions'

interface GenericListProps {
  config: ListConfig
  contextMenuBuilder?: (row: any) => ContextMenuItem[]
}

interface ServerListResponse {
  items: any[]
  total: number
  page: number
  pageSize: number
}

const fetcher = (url: string) => api.get(url).then((r) => r.data)

const toCamel = (value: string) => value.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
const toSnake = (value: string) => value.replace(/([A-Z])/g, '_$1').toLowerCase()
const isStateField = (field: string) => ['obj_state'].includes(field)
const isLangField = (field: string) => ['obj_lang'].includes(field)

const parseDateAsUtc = (rawValue: any): Date | null => {
  if (!rawValue) return null
  if (rawValue instanceof Date) return Number.isNaN(rawValue.getTime()) ? null : rawValue

  const raw = String(rawValue).trim()
  if (!raw) return null

  const hasZone = /(z|[+-]\d{2}:?\d{2})$/i.test(raw)
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T')
  const iso = hasZone ? normalized : `${normalized}Z`
  const parsed = new Date(iso)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const bulkStateOptions = [
  { value: 'published', label: 'Published', badgeClassName: 'bg-green-100 text-green-700', iconClassName: 'fas fa-check-circle' },
  { value: 'unpublish', label: 'Unpublish', badgeClassName: 'bg-gray-100 text-gray-700', iconClassName: 'fas fa-ban' },
  { value: 'draft', label: 'Draft', badgeClassName: 'bg-yellow-100 text-yellow-700', iconClassName: 'fas fa-pen' },
]

export default function GenericList({ config, contextMenuBuilder }: GenericListProps) {
  const { mutate } = useSWRConfig()
  const { user } = useAuth()
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  const [selectedKeys, setSelectedKeys] = useState<Set<string | number>>(new Set())
  const [bulkActionLoading, setBulkActionLoading] = useState<null | 'status' | 'delete'>(null)
  const [pendingStateValue, setPendingStateValue] = useState('')
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; row: any; anchor?: 'cursor' | 'fixed-right' } | null>(null)
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<{ field: string; direction: 'asc' | 'desc' } | null>(null)
  const [timezone, setTimezone] = useState('Asia/Bangkok')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTitle, setConfirmTitle] = useState('')
  const [confirmDescription, setConfirmDescription] = useState('')
  const [confirmAction, setConfirmAction] = useState<null | (() => Promise<void> | void)>(null)
  const [confirmLabel, setConfirmLabel] = useState('Confirm')
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const listRootRef = useRef<HTMLDivElement>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    setToastType(type)
    setToastMessage(message)
    setToastOpen(true)
  }

  const openConfirm = (
    title: string,
    description: string,
    action: () => Promise<void> | void,
    actionLabel = 'Confirm',
  ) => {
    setConfirmTitle(title)
    setConfirmDescription(description)
    setConfirmAction(() => action)
    setConfirmLabel(actionLabel)
    setConfirmOpen(true)
  }

  const handleConfirmAccept = async () => {
    const action = confirmAction
    setConfirmOpen(false)
    setConfirmAction(null)
    if (!action) return
    await action()
  }

  const rowKey = config.rowKey || 'id'
  const pageSize = config.limit || 15
  const isServerSide = config.serverSide === true
  const moduleKey = useMemo(() => resolveModuleKey(config.endpoint), [config.endpoint])
  const canView = useMemo(() => hasModuleAction(user, moduleKey, ['view', 'read']), [moduleKey, user])
  const canCreate = useMemo(() => hasModuleAction(user, moduleKey, ['create', 'modify', 'update']), [moduleKey, user])
  const canDelete = useMemo(() => hasModuleAction(user, moduleKey, ['delete', 'remove']), [moduleKey, user])
  const canPublish = useMemo(() => hasModuleAction(user, moduleKey, ['publish']), [moduleKey, user])
  const canExport = useMemo(() => hasModuleAction(user, moduleKey, ['export']), [moduleKey, user])

  const filterContextItemsByPermission = useCallback((items: ContextMenuItem[]): ContextMenuItem[] => {
    return items.filter((item) => {
      const action = inferActionFromLabel(item.label)
      if (!action) return true
      if (action === 'view') return canView
      if (action === 'modify') return canCreate
      if (action === 'delete') return canDelete
      if (action === 'publish') return canPublish
      if (action === 'export') return canExport
      return true
    })
  }, [canCreate, canDelete, canExport, canPublish, canView])

  const getValue = useCallback((row: any, field: string) => {
    if (!row) return undefined
    const candidates = [field, toCamel(field), toSnake(field)]
    for (const key of candidates) {
      if (Object.prototype.hasOwnProperty.call(row, key)) return row[key]
    }
    return undefined
  }, [])

  const getRowKey = useCallback((row: any) => {
    return getValue(row, rowKey) ?? row.id ?? row._id ?? row.obj_content_id ?? row.obj_id
  }, [getValue, rowKey])

  const selectAllRef = useRef<HTMLInputElement>(null)

  const getFixedContextMenuX = useCallback(() => {
    const fixedMenuWidth = 192
    const fixedRightOffset = 12
    const minLeft = 8
    const containerRect = listRootRef.current?.getBoundingClientRect()
    const rightEdge = containerRect?.right ?? window.innerWidth
    return Math.max(minLeft, rightEdge - fixedMenuWidth - fixedRightOffset)
  }, [])

  const effectiveSearchFields = useMemo(() => {
    if (config.search?.fields?.length) return config.search.fields
    if (config.keywords) {
      const fields = Array.isArray(config.keywords)
        ? config.keywords
        : config.keywords.split(',').map((f) => f.trim()).filter(Boolean)
      return fields
    }
    if (config.filter) {
      const fields = Array.isArray(config.filter) ? config.filter : config.filter.split(',').map((f) => f.trim()).filter(Boolean)
      return fields
    }
    return []
  }, [config.filter, config.keywords, config.search])

  const requestUrl = useMemo(() => {
    if (!isServerSide) return config.endpoint

    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))

    const trimmedSearch = searchQuery.trim()
    if (trimmedSearch) {
      params.set('search', trimmedSearch)
      if (effectiveSearchFields.length > 0) {
        params.set('searchFields', effectiveSearchFields.join(','))
      }
    }

    if (sort?.field) {
      params.set('sortField', sort.field)
      params.set('sortDirection', sort.direction)
    }

    Object.entries(filters).forEach(([key, values]) => {
      if (!values || values.length === 0) return
      params.set(`filter_${key}`, values.join(','))
    })

    const query = params.toString()
    return query ? `${config.endpoint}?${query}` : config.endpoint
  }, [config.endpoint, effectiveSearchFields, filters, isServerSide, page, pageSize, searchQuery, sort])

  const { data, isLoading, error } = useSWR(requestUrl, fetcher)

  const serverPayload = useMemo<ServerListResponse | null>(() => {
    if (!isServerSide || !data || Array.isArray(data)) return null
    const maybeItems = (data as ServerListResponse).items
    if (!Array.isArray(maybeItems)) return null

    return {
      items: maybeItems,
      total: Number((data as ServerListResponse).total || 0),
      page: Number((data as ServerListResponse).page || page),
      pageSize: Number((data as ServerListResponse).pageSize || pageSize),
    }
  }, [data, isServerSide, page, pageSize])

  const baseData = useMemo<any[]>(() => {
    if (serverPayload) return serverPayload.items
    return Array.isArray(data) ? data : []
  }, [data, serverPayload])

  const filterConfigs = useMemo(() => {
    const base = config.filters && config.filters.length > 0 ? [...config.filters] : []

    const hasStateCol = config.columns.some((c) => isStateField(c.field))
    const hasLangCol = config.columns.some((c) => isLangField(c.field))

    const hasStateFilter = base.some((f) => f.key === 'obj_state')
    const hasLangFilter = base.some((f) => f.key === 'obj_lang')

    if (hasStateCol && !hasStateFilter) base.push({ key: 'obj_state', label: 'Status', deriveFromData: true })
    if (hasLangCol && !hasLangFilter) base.push({ key: 'obj_lang', label: 'Language', deriveFromData: true })

    return base
  }, [config.columns, config.filters])

  const filterOptions = useMemo(() => {
    const result: Record<string, Array<{ value: string | boolean; label: string }>> = {}

    // master lookups for common fields
    const masterLookups: Record<string, Array<{ value: string | boolean; label: string }>> = {
      obj_lang: Object.entries(langLookup).map(([code, meta]) => ({ value: code, label: meta.label })),
      obj_state: [
        { value: 'draft', label: 'Draft' },
        { value: 'published', label: 'Published' },
        { value: 'unpublish', label: 'Unpublished' },
      ],
    }

    filterConfigs.forEach((f) => {
      if (f.options) {
        result[f.key] = f.options
        return
      }

      if (f.lookup?.endpoint || f.lookup?.module) {
        result[f.key] = []
        return
      }

      if (masterLookups[f.key]) {
        result[f.key] = masterLookups[f.key]
        return
      }

      if (f.deriveFromData && baseData) {
        const values = Array.from(new Set((baseData || []).map((item: any) => getValue(item, f.key)).filter(Boolean)))
        result[f.key] = values.map((v) => ({ value: String(v), label: String(v) }))
      }
    })

    return result
  }, [baseData, filterConfigs, getValue])

  const [lookupFilterOptions, setLookupFilterOptions] = useState<Record<string, Array<{ value: string | boolean; label: string }>>>({})

  useEffect(() => {
    let cancelled = false

    const lookupFilters = filterConfigs.filter((item) => item.lookup?.endpoint || item.lookup?.module)
    if (!lookupFilters.length) {
      setLookupFilterOptions({})
      return
    }

    const loadLookupFilters = async () => {
      const entries = await Promise.all(
        lookupFilters.map(async (item) => {
          try {
            const options = await fetchLookupOptions(item.lookup!)
            const normalized = options.map((opt) => ({
              value: String(opt.value),
              label: opt.label,
            }))
            return [item.key, normalized] as const
          } catch {
            return [item.key, []] as const
          }
        }),
      )

      if (cancelled) return
      setLookupFilterOptions(Object.fromEntries(entries))
    }

    loadLookupFilters()

    return () => {
      cancelled = true
    }
  }, [filterConfigs])

  const filteredData = useMemo(() => {
    if (isServerSide && serverPayload) {
      return serverPayload.items
    }

    let items = baseData as any[]

    if (searchQuery && effectiveSearchFields.length) {
      const term = searchQuery.toLowerCase()
      items = items.filter((item) =>
        effectiveSearchFields.some((field) => String(getValue(item, field) || '').toLowerCase().includes(term))
      )
    }

    if (filterConfigs && filterConfigs.length > 0) {
      items = items.filter((item) =>
        filterConfigs.every((f) => {
          const active = filters[f.key]
          if (!active || active.length === 0) return true
          const value = String(getValue(item, f.key) ?? '')
          return active.includes(value)
        })
      )
    }

    return items
  }, [baseData, effectiveSearchFields, filterConfigs, filters, getValue, isServerSide, searchQuery, serverPayload])

  const sortedData = useMemo(() => {
    if (isServerSide && serverPayload) {
      return serverPayload.items
    }

    if (!sort) return filteredData

    const targetColumn = config.columns.find((col) => col.field === sort.field)
    const direction = sort.direction === 'asc' ? 1 : -1

    const toComparable = (value: any) => {
      if (value === null || value === undefined) return ''
      if (targetColumn?.type === 'date' || targetColumn?.type === 'datetime') {
        const time = new Date(value).getTime()
        return Number.isNaN(time) ? 0 : time
      }
      return value
    }

    return [...filteredData].sort((left, right) => {
      const leftValue = toComparable(getValue(left, sort.field))
      const rightValue = toComparable(getValue(right, sort.field))

      const leftNumber = Number(leftValue)
      const rightNumber = Number(rightValue)
      const bothNumbers = !Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)

      if (bothNumbers) {
        if (leftNumber < rightNumber) return -1 * direction
        if (leftNumber > rightNumber) return 1 * direction
        return 0
      }

      const leftText = String(leftValue).toLowerCase()
      const rightText = String(rightValue).toLowerCase()
      if (leftText < rightText) return -1 * direction
      if (leftText > rightText) return 1 * direction
      return 0
    })
  }, [config.columns, filteredData, getValue, isServerSide, serverPayload, sort])

  // pagination
  const paginatedData = useMemo(() => {
    if (isServerSide && serverPayload) {
      return serverPayload.items
    }

    const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize))
    const safePage = Math.min(page, totalPages)
    const start = (safePage - 1) * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [isServerSide, page, pageSize, serverPayload, sortedData])

  useEffect(() => {
    if (!isServerSide) {
      setSearchQuery(searchInput)
    }
  }, [isServerSide, searchInput])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, filters])

  const handleSearchSubmit = useCallback(() => {
    if (!isServerSide) return
    setSearchQuery(searchInput)
    setPage(1)
  }, [isServerSide, searchInput])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const syncTimezone = () => {
      try {
        const raw = localStorage.getItem('site-settings')
        if (!raw) return
        const parsed = JSON.parse(raw) as Partial<SiteSettings>
        const nextTimezone = parsed.timezone?.trim()
        if (nextTimezone) setTimezone(nextTimezone)
      } catch {
        // Ignore malformed storage
      }
    }

    syncTimezone()

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<Partial<SiteSettings>>
      const nextTimezone = customEvent.detail?.timezone?.trim()
      if (nextTimezone) {
        setTimezone(nextTimezone)
        return
      }
      syncTimezone()
    }

    window.addEventListener('site-settings:update', handler)
    return () => window.removeEventListener('site-settings:update', handler)
  }, [])

  const clearAllFilters = useCallback(() => setFilters({}), [])

  const activeFilterBadges = useMemo(() => {
    const badges: Array<{ key: string; label: string; value: string; valueLabel: string }> = []
    filterConfigs.forEach((f) => {
      const selected = filters[f.key]
      if (!selected || selected.length === 0) return
      const options = filterOptions[f.key] || []
      selected.forEach((val) => {
        const dynamicOptions = lookupFilterOptions[f.key] || []
        const match = [...dynamicOptions, ...options].find((o) => String(o.value) === String(val))
        badges.push({ key: f.key, label: f.label, value: val, valueLabel: match?.label || val })
      })
    })
    return badges
  }, [filterConfigs, filterOptions, filters, lookupFilterOptions])

  const handleRemoveBadge = useCallback((key: string, value: string) => {
    setFilters((prev) => {
      const existing = prev[key] || []
      const next = existing.filter((v) => v !== value)
      return { ...prev, [key]: next }
    })
  }, [])

  const handleToggleSelect = (key: string | number) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    if (!filteredData.length) return
    const allKeys = filteredData.map((item) => getRowKey(item)).filter((k) => k !== undefined)
    const allSelected = allKeys.length > 0 && allKeys.every((k) => selectedKeys.has(k))
    setSelectedKeys(allSelected ? new Set() : new Set(allKeys))
  }

  useEffect(() => {
    if (!selectAllRef.current) return
    const allKeys = filteredData.map((item) => getRowKey(item)).filter((k) => k !== undefined)
    const allSelected = allKeys.length > 0 && allKeys.every((k) => selectedKeys.has(k))
    const someSelected = allKeys.some((k) => selectedKeys.has(k))
    selectAllRef.current.checked = allSelected
    selectAllRef.current.indeterminate = !allSelected && someSelected
  }, [filteredData, rowKey, selectedKeys])

  const handleRowMenuClick = useCallback((row: any, event: MouseEvent<HTMLButtonElement>) => {
    if (!contextMenuBuilder) return
    const permittedItems = filterContextItemsByPermission(contextMenuBuilder(row))
    if (permittedItems.length === 0) return
    event.preventDefault()
    event.stopPropagation()
    const rect = event.currentTarget.getBoundingClientRect()
    const fixedX = getFixedContextMenuX()
    setContextMenu({ row, x: fixedX, y: rect.bottom, anchor: 'fixed-right' })
  }, [contextMenuBuilder, filterContextItemsByPermission, getFixedContextMenuX])

  const handleExport = () => {
    const columns = config.columns
    const fields = columns.map((col) => col.field)
    const labels = columns.map((col) => col.name)

    const exportRowsToCsv = (rows: any[]) => {
      if (!rows.length) return

      const csvRows: string[] = []
      csvRows.push(labels.map((label) => `"${String(label).replace(/"/g, '""')}"`).join(','))

      rows.forEach((row) => {
        const values = fields.map((key) => {
          const value = getValue(row, key)
          if (value === null || value === undefined) return '""'
          return `"${String(value).replace(/"/g, '""')}"`
        })
        csvRows.push(values.join(','))
      })

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${config.title.toLowerCase().replace(/\s+/g, '-')}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }

    if (!isServerSide) {
      exportRowsToCsv(sortedData)
      return
    }

    const payload = {
      fields,
      search: searchQuery.trim(),
      searchFields: effectiveSearchFields,
      sortField: sort?.field,
      sortDirection: sort?.direction,
      filters,
    }

    api
      .post(`${config.endpoint}/export`, payload)
      .then((response) => {
        const items = Array.isArray(response?.data?.items) ? response.data.items : []
        exportRowsToCsv(items)
      })
      .catch(() => {
        // Keep UX simple; fallback to current table if export endpoint fails.
        exportRowsToCsv(sortedData)
      })
  }

  const handleSort = useCallback((field: string) => {
    setSort((prev) => {
      if (!prev || prev.field !== field) return { field, direction: 'asc' }
      if (prev.direction === 'asc') return { field, direction: 'desc' }
      return null
    })
  }, [])

  const selectedIds = useMemo(() => Array.from(selectedKeys).filter((id) => id !== undefined && id !== null), [selectedKeys])
  const selectedCount = selectedIds.length
  const hasBulkStateAction = useMemo(() => canPublish && config.columns.some((col) => isStateField(col.field)), [canPublish, config.columns])

  const clearSelection = useCallback(() => {
    setSelectedKeys(new Set())
    setPendingStateValue('')
  }, [])

  const runBulkStatusUpdate = useCallback(async (nextState: string) => {
    if (!nextState || selectedIds.length === 0) return

    setBulkActionLoading('status')
    try {
      let successCount = 0
      let failedCount = 0

      try {
        const response = await api.post(`${config.endpoint}/actions`, {
          action: 'setstatus',
          ids: selectedIds,
          state: nextState,
        })

        successCount = Number(response?.data?.success ?? 0)
        failedCount = Number(response?.data?.failed ?? 0)
      } catch {
        const results = await Promise.allSettled(
          selectedIds.map((id) =>
            api.put(`${config.endpoint}/${id}`, {
              obj_state: nextState,
            }),
          ),
        )
        successCount = results.filter((result) => result.status === 'fulfilled').length
        failedCount = results.length - successCount
      }

      if (failedCount > 0) {
        showToast('error', `Updated ${successCount} item(s). Failed ${failedCount} item(s).`)
      } else {
        showToast('success', `Updated ${successCount} item(s) successfully.`)
      }

      await mutate(requestUrl)
      clearSelection()
    } finally {
      setBulkActionLoading(null)
      setPendingStateValue('')
    }
  }, [clearSelection, config.endpoint, mutate, requestUrl, selectedIds])

  const runBulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) return

    setBulkActionLoading('delete')
    try {
      let successCount = 0
      let failedCount = 0

      try {
        const response = await api.post(`${config.endpoint}/actions`, {
          action: 'delete',
          ids: selectedIds,
        })

        successCount = Number(response?.data?.success ?? 0)
        failedCount = Number(response?.data?.failed ?? 0)
      } catch {
        const results = await Promise.allSettled(selectedIds.map((id) => api.delete(`${config.endpoint}/${id}`)))
        successCount = results.filter((result) => result.status === 'fulfilled').length
        failedCount = results.length - successCount
      }

      if (failedCount > 0) {
        showToast('error', `Deleted ${successCount} item(s). Failed ${failedCount} item(s).`)
      } else {
        showToast('success', `Deleted ${successCount} item(s) successfully.`)
      }

      await mutate(requestUrl)
      clearSelection()
    } finally {
      setBulkActionLoading(null)
    }
  }, [clearSelection, config.endpoint, mutate, requestUrl, selectedIds])

  const defaultAlign = useCallback((col: ListColumn): 'left' | 'center' | 'right' => {
    const centerFields = ['obj_state', 'obj_lang', 'obj_modified_date', 'created_at', 'updated_at']
    if (centerFields.includes(col.field)) return 'center'
    return 'left'
  }, [])

  const handleRowOpen = useCallback((row: any) => {
    if (!config.onRowOpen) return
    if (!canView) return
    const result = config.onRowOpen(row)
    if (typeof result === 'string') {
      window.location.href = result
    }
  }, [canView, config])

  const resolveImageSrc = useCallback((row: any, fieldName: string, rawValue: any) => {
    if (!rawValue) return ''
    const value = String(rawValue).trim()
    if (!value) return ''

    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:') || value.startsWith('blob:')) {
      return value
    }

    const genValue = getValue(row, `${fieldName}_gen`)
    if (!genValue) return ''

    const gen = String(genValue).trim()
    if (!gen) return ''

    const fileName = value.replace(/^\/+/, '')
    const baseApi = process.env.NEXT_PUBLIC_BASE_API_URL || 'http://localhost:3000'
    const endpoint = (config.endpoint || '').replace(/^\/+/, '').replace(/\/+$/, '')
    const moduleName = endpoint
    return `${baseApi}/stock/${moduleName}/${gen}/${fileName}`
  }, [config.endpoint, getValue])

  const formatDateTimeByTimezone = useCallback((rawValue: any) => {
    const date = parseDateAsUtc(rawValue)
    if (!date) return null

    const resolvedTimezone = timezone || 'Asia/Bangkok'
    const hour12 = resolvedTimezone === 'Asia/Bangkok' ? false : undefined

    const buildResult = (timeZone: string) => ({
      dateText: date.toLocaleDateString(undefined, { timeZone }),
      timeText: date.toLocaleTimeString(undefined, { timeZone, hour: '2-digit', minute: '2-digit', hour12 }),
      offsetText: getTimezoneOffsetLabel(timeZone, date),
    })

    try {
      return buildResult(resolvedTimezone)
    } catch {
      return buildResult('Asia/Bangkok')
    }
  }, [timezone])

  const formatCell = useCallback((col: ListColumn, value: any, row: any) => {
    if (col.render) return col.render(value, row)
    if (col.type === 'image') {
      const src = resolveImageSrc(row, col.field, value)
      
      if (!src) return '-'
      return (
        <img
          src={src}
          alt={String(getValue(row, 'title') || col.name || 'thumbnail')}
          className="h-10 w-16 rounded object-cover border border-[color:var(--border)]"
          loading="lazy"
        />
      )
    }
    if (isStateField(col.field)) {
      const map: Record<string, string> = {
        publish: 'bg-green-100 text-green-700',
        published: 'bg-green-100 text-green-700',
        unpublish: 'bg-gray-100 text-gray-700',
        draft: 'bg-yellow-100 text-yellow-700',
      }
      const iconMap: Record<string, string> = {
        draft: 'fas fa-pen',
        publish: 'fas fa-check-circle',
        published: 'fas fa-check-circle',
        unpublish: 'fas fa-ban',
      }
      const cls = map[String(value)?.toLowerCase()] || 'bg-[color:var(--border)] text-[color:var(--text)]'
      let displayState = String(value || '-')
      if (String(value).toLowerCase() === 'draft') {
        displayState = 'Draft'
      }else if (String(value).toLowerCase() === 'published') {
        displayState = 'Published'
      }else if (String(value).toLowerCase() === 'unpublish') {
        displayState = 'Unpublished'
      }
      const icon = iconMap[String(value)?.toLowerCase()]
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-2 ${cls}`}>
          <span>{displayState}</span>
          {icon && <i className={icon} aria-hidden="true" />}
        </span>
      )
    }
    if (isLangField(col.field)) {
      const raw = String(value || '').toLowerCase()
      const normalized = raw.includes('-') ? raw.split('-')[0] : raw
      const lang = raw ? langLookup[raw] || langLookup[normalized] : undefined
      const flagClass = lang?.flag
      const icon = lang?.icon
      return (
        <span className="inline-flex items-center gap-2">
          {flagClass && <span className={`fi fi-${flagClass} text-2xl`} style={{ width: '1.75em', lineHeight: '1em' }} aria-label={lang?.label || raw} />}
          {!flagClass && icon && <span className="text-2xl" aria-label={lang?.label || raw}>{icon}</span>}
          {!flagClass && !icon && <span className="text-2xl" aria-label={raw}>{raw.toUpperCase() || '-'}</span>}
        </span>
      )
    }
    if (col.type === 'date' && value) {
      return new Date(value).toLocaleDateString()
    }
    if (col.type === 'datetime' && value) {
      const dateTime = formatDateTimeByTimezone(value)
      if (!dateTime) return '-'

      return (
        <div className="inline-flex flex-col leading-tight text-center">
          <span>{dateTime.dateText}</span>
          <span className="text-xs text-[color:var(--text-muted)] inline-flex items-center justify-center gap-1 mt-1">
            <span>{dateTime.timeText}</span>
            <i className="far fa-clock" aria-hidden="true" />
          </span>
        </div>
      )
    }
    return value
  }, [formatDateTimeByTimezone, getValue, resolveImageSrc])

  const baseColumns = useMemo(() => {
    const hasMenu = !!(contextMenuBuilder && config.rowMenu !== false)
    const hasSelect = !!config.select
    const reservedWidthPx = (hasSelect ? 56 : 0) + (hasMenu ? 56 : 0)

    const computeBalancedWidth = (declaredWidth: number | undefined, totalDeclaredWidth: number, count: number) => {
      if (reservedWidthPx <= 0) return declaredWidth
      if (count <= 0) return undefined

      const ratio = totalDeclaredWidth > 0
        ? (declaredWidth ?? 0) / totalDeclaredWidth
        : 1 / count

      return `calc((100% - ${reservedWidthPx}px) * ${ratio})`
    }

    const totalDeclaredWidth = config.columns.reduce((sum, col) => sum + (col.width ?? 0), 0)

    return config.columns.map((col) => {
      return {
        key: col.field,
        label: col.name,
        width: computeBalancedWidth(col.width, totalDeclaredWidth, config.columns.length),
        align: col.align ?? defaultAlign(col),
        headerClassName: '!py-2 !px-3',
        cellClassName: '!px-3',
        sortable: !!col.sort,
        sortDirection: sort?.field === col.field ? sort.direction : null,
        onSort: col.sort ? () => handleSort(col.field) : undefined,
        render: (_val: any, row: any) => formatCell(col, getValue(row, col.field), row),
      }
    })
  }, [config.columns, config.rowMenu, config.select, contextMenuBuilder, defaultAlign, formatCell, getValue, handleSort, sort])

  const columns = useMemo(() => {
    const usePinnedEdgeColumns = config.scroll && config.pinEdgeColumns === true

    const selectColumn = {
      key: '__select',
      label: '',
      width: 56,
      align: 'center' as const,
      sticky: usePinnedEdgeColumns ? ('left' as const) : undefined,
      headerClassName: '!px-2 !py-2 normal-case !tracking-normal',
      cellClassName: '!px-2 !py-2',
      renderHeader: () => (
        <input
          ref={selectAllRef}
          type="checkbox"
          onChange={handleSelectAll}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          className="w-4 h-4 shrink-0 rounded accent-[color:var(--accent)] text-[color:var(--accent)] focus:ring-0 focus:outline-none focus:border-0 outline-none border-none shadow-none cursor-pointer"
          aria-label="Select all rows"
        />
      ),
      render: (_: any, row: any) => {
        const key = getRowKey(row)
        return (
          <input
            type="checkbox"
            checked={selectedKeys.has(key)}
            onChange={() => key !== undefined && handleToggleSelect(key)}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            className="w-4 h-4 shrink-0 rounded accent-[color:var(--accent)] text-[color:var(--accent)] focus:ring-0 focus:outline-none focus:border-0 outline-none border-none shadow-none cursor-pointer"
            aria-label="Select row"
          />
        )
      },
    }

    const menuColumn = contextMenuBuilder && config.rowMenu !== false ? [
      {
        key: '__menu',
        label: '',
        width: 56,
        align: 'center' as const,
        sticky: usePinnedEdgeColumns ? ('right' as const) : undefined,
        headerClassName: '!px-2 !py-2 normal-case !tracking-normal',
        cellClassName: '!px-2 !py-2',
        render: (_: any, row: any) => {
          const permittedItems = filterContextItemsByPermission(contextMenuBuilder(row))
          if (permittedItems.length === 0) return null
          return (
            <button
              type="button"
              onClick={(e) => handleRowMenuClick(row, e)}
              onMouseDown={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[color:var(--border)] text-[color:var(--text-muted)]"
              aria-label="Row actions"
            >
              <i className="fas fa-ellipsis-v" />
            </button>
          )
        },
      },
    ] : []

    if (!config.select) return [...baseColumns, ...menuColumn]

    return [selectColumn, ...baseColumns, ...menuColumn]
  }, [baseColumns, config.pinEdgeColumns, config.rowMenu, config.scroll, config.select, contextMenuBuilder, filterContextItemsByPermission, getRowKey, handleRowMenuClick, handleSelectAll, selectedKeys])

  const tableMinWidth = useMemo(() => calculateTableMinWidth(config), [config])

  const contextItems = contextMenu && contextMenuBuilder
    ? filterContextItemsByPermission(contextMenuBuilder(contextMenu.row))
    : []
  const totalRecords = serverPayload ? serverPayload.total : sortedData.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const hasNoRecords = !isLoading && totalRecords === 0

  if (error) {
    return (
      <OperationErrorPage
        message={extractApiErrorMessage(error) || 'Failed to load list data.'}
      />
    )
  }

  return (
    <div ref={listRootRef}>
      {selectedCount > 0 && (
        <div className="fixed inset-x-0 top-0 z-[60] h-[var(--nav-height)] border-b border-[color:var(--border)] backdrop-blur bg-[color:var(--card)]/90">
          <div className="relative h-full flex items-center px-3 sm:px-6">
            <div className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold whitespace-nowrap pointer-events-none">
              Selected {selectedCount}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={clearSelection}
                disabled={bulkActionLoading !== null}
              >
                Cancel
              </button>

              {hasBulkStateAction && (
                <div className="w-auto">
                  <CustomSelect
                    value={pendingStateValue}
                    onChange={(value) => {
                      const nextValue = String(value)
                      setPendingStateValue(nextValue)
                      if (nextValue) {
                        const optionLabel = bulkStateOptions.find((item) => item.value === nextValue)?.label || nextValue
                        openConfirm(
                          `Are you sure you want to ${optionLabel.toLowerCase()}?`,
                          `Setting ${selectedIds.length} selected item(s) to ${optionLabel} will apply immediately.`,
                          async () => {
                            await runBulkStatusUpdate(nextValue)
                          },
                          'Confirm',
                        )
                      }
                    }}
                    options={bulkStateOptions}
                    placeholder="Set status"
                    disabled={bulkActionLoading !== null}
                    triggerClassName="!w-auto h-9 rounded-[10px] bg-[color:var(--bg-alt)] border-[color:var(--border)] px-3 py-1.5 font-semibold hover:bg-[color:var(--bg-alt)]"
                  />
                </div>
              )}

              {canDelete && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() =>
                    openConfirm(
                      'Are you sure you want to delete?',
                      `Delete ${selectedIds.length} selected item(s)? This action cannot be undone.`,
                      async () => {
                        await runBulkDelete()
                      },
                      'Confirm',
                    )
                  }
                  disabled={bulkActionLoading !== null}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{config.title}</h1>
          {config.search?.placeholder && (
            <p className="text-[color:var(--text-muted)] text-sm">Use search or filters to refine results.</p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {config.export && canExport && (
            <button
              type="button"
              onClick={handleExport}
              className={`btn btn-secondary ${hasNoRecords ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={hasNoRecords}
            >
              Export CSV
            </button>
          )}
          {config.createHref && canCreate && (
            <Link href={config.createHref} className="btn btn-primary">
              Create
            </Link>
          )}
        </div>
      </div>

        <div className="card rounded-lg p-4">
        {(effectiveSearchFields.length > 0 || (filterConfigs && filterConfigs.length > 0)) && (
          <>
            <div className="space-y-2 pb-2">
              <div className="flex gap-3 flex-col sm:flex-row sm:items-center">
                {effectiveSearchFields.length > 0 && (
                  <div className="w-full sm:flex-1 sm:min-w-[30%]">
                    <SearchBar
                      value={searchInput}
                      onChange={setSearchInput}
                      onSubmit={handleSearchSubmit}
                      placeholder={config.search?.placeholder || 'Search...'}
                    />
                  </div>
                )}
                {filterConfigs && filterConfigs.length > 0 && (
                  <div className="w-full sm:w-auto sm:max-w-[70%] sm:ml-auto sm:shrink-0 sm:overflow-visible">
                    <FilterBar
                      filters={filterConfigs.map((f) => ({
                        key: f.key,
                        label: f.label,
                        options: lookupFilterOptions[f.key] || filterOptions[f.key] || [],
                      }))}
                      values={filters}
                      onChange={(k, v) => setFilters((prev) => ({ ...prev, [k]: v }))}
                    />
                  </div>
                )}
              </div>
              <div className="mt-2 mb-2 min-h-[30px] flex items-center">
                {activeFilterBadges.length > 0 ? (
                  <div className="flex items-center gap-1 text-xs overflow-x-auto whitespace-nowrap pr-1 w-full">
                    {activeFilterBadges.map((b, idx) => (
                      <span
                        key={`${b.key}-${idx}`}
                        className="inline-flex shrink-0 items-center gap-1 px-2 py-[2px] rounded-full bg-[color:var(--border)] text-[color:var(--text)]"
                      >
                        <span>{b.valueLabel}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBadge(b.key, b.value)}
                          className="text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
                          aria-label={`Remove ${b.valueLabel}`}
                        >
                          x
                        </button>
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="text-[color:var(--accent)] text-xs font-semibold shrink-0"
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-transparent select-none">reserved</div>
                )}
              </div>
            </div>
            <div className="border-t border-[color:var(--border)]" />
          </>
        )}

        {hasNoRecords ? (
          <div className="min-h-[520px] flex items-center justify-center p-2 text-center">
            <div className="max-w-md">
              <div className="mx-auto mb-6 h-36 w-36 rounded-full bg-[color:var(--bg-alt)] border border-[color:var(--border)] flex items-center justify-center text-[56px] text-[color:var(--text-muted)]">
                <i className="far fa-folder-open" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">Add your first items</h3>
              <p className="text-[color:var(--text-muted)] mb-6">Start creating content for your website. You can add items as needed.</p>
              {config.createHref && canCreate && (
                <Link href={config.createHref} className="btn btn-primary px-6">
                  Add items
                </Link>
              )}
            </div>
          </div>
        ) : (
          <Table
            columns={columns}
            data={paginatedData}
            loading={isLoading}
            minHeight={520}
            framed={false}
            onRowContextMenu={contextMenuBuilder ? (row, x, y) => {
              const permittedItems = filterContextItemsByPermission(contextMenuBuilder(row))
              if (permittedItems.length === 0) return
              setContextMenu({ row, x, y, anchor: 'cursor' })
            } : undefined}
            onRowClick={handleRowOpen}
            tableMinWidth={tableMinWidth}
            horizontalScroll={!!config.scroll}
          />
        )}
        </div>

        {/* Pagination */}
        {totalRecords > pageSize && (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="text-sm text-[color:var(--text-muted)]">
              Showing {totalRecords === 0 ? 0 : (page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalRecords)} of {totalRecords}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="btn btn-secondary"
                disabled={page === 1}
              >
                Prev
              </button>
              <span className="text-sm">Page {page} / {totalPages}</span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="btn btn-secondary"
                disabled={page >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {contextMenu && contextMenuBuilder && (
        <ContextMenu
          items={contextItems}
          x={contextMenu.x}
          y={contextMenu.y}
          fixedRightOffset={contextMenu.anchor === 'fixed-right' ? 16 : undefined}
          onClose={() => setContextMenu(null)}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel={confirmLabel}
        onCancel={() => {
          setConfirmOpen(false)
          setConfirmAction(null)
        }}
        onConfirm={handleConfirmAccept}
        loading={bulkActionLoading !== null}
      />

      <Toast
        open={toastOpen}
        message={toastMessage}
        type={toastType}
        onClose={() => setToastOpen(false)}
      />
    </div>
  )
}
