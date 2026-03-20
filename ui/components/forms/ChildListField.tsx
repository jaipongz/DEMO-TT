import { MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Table from '../core/Table'
import { ChildEditorFieldConfig, FormField, supportToAccept } from '../../types/formConfig'
import FileUpload from '../core/FileUpload'
import VideoUpload from '../core/VideoUpload'
import FileTypeUpload from '../core/FileTypeUpload'
import ContextMenu, { ContextMenuItem } from '../core/ContextMenu'
import WysiwygEditor from '../core/WysiwygEditor'

interface ChildListFieldProps {
  field: FormField
  value: any
  onChange: (value: any[]) => void
  readOnly?: boolean
  uploadModule?: string
  onEditorOpenChange?: (open: boolean) => void
}

function toLabel(value: string): string {
  return String(value || '')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function normalizeRows(raw: any): any[] {
  if (Array.isArray(raw)) return raw
  if (!raw) return []
  if (typeof raw === 'object') return [raw]
  return []
}

function defaultColumns(rows: any[]) {
  if (rows.length > 0 && rows[0] && typeof rows[0] === 'object') {
    return Object.keys(rows[0]).map((key) => ({ key, label: toLabel(key), type: 'text' as const }))
  }

  return [
    { key: 'name', label: 'Name', type: 'text' as const },
    { key: 'value', label: 'Value', type: 'text' as const },
  ]
}

function defaultFields(columns: Array<{ key: string; label: string; type?: 'text' | 'date' | 'datetime' }>): ChildEditorFieldConfig[] {
  if (!columns.length) {
    return [
      { field: 'name', name: 'Name', width: 50, type: 'text' },
      { field: 'value', name: 'Value', width: 50, type: 'text' },
    ]
  }

  const width = columns.length >= 3 ? 33 : columns.length === 2 ? 50 : 100
  return columns.map((column) => ({
    field: column.key,
    name: column.label,
    width,
    type: column.type === 'date' || column.type === 'datetime' ? column.type : 'text',
  }))
}

function groupFields(fields: ChildEditorFieldConfig[]): ChildEditorFieldConfig[][] {
  const rows: ChildEditorFieldConfig[][] = []
  let currentRow: ChildEditorFieldConfig[] = []
  let currentWidth = 0

  for (const field of fields) {
    const width = field.width ?? 100
    if (currentWidth + width > 100 && currentRow.length > 0) {
      rows.push(currentRow)
      currentRow = [field]
      currentWidth = width
      continue
    }

    currentRow.push(field)
    currentWidth += width
  }

  if (currentRow.length > 0) rows.push(currentRow)

  return rows
}

function toCamelCase(input: string): string {
  return input
    .replace(/[-_]+([a-zA-Z0-9])/g, (_, char: string) => String(char).toUpperCase())
    .replace(/^([A-Z])/, (char: string) => char.toLowerCase())
}

function getGenValue(row: Record<string, any>, fieldName: string): string {
  const snake = `${fieldName}_gen`
  const camel = toCamelCase(snake)
  const value = row?.[snake] ?? row?.[camel]
  return value === undefined || value === null ? '' : String(value)
}

function renderEditorInput(
  field: ChildEditorFieldConfig,
  value: any,
  onChange: (next: any) => void,
  readOnly: boolean,
  uploadModule: string,
  genValue?: string,
  onUploadMeta?: (meta: { url: string; gen: string; fileName?: string } | null) => void,
  editorId?: string,
) {
  const type = field.type || 'text'
  const disabledProps = readOnly ? { disabled: true, readOnly: true as const } : {}
  const baseClass = 'w-full px-3 py-2 border border-[color:var(--border)] rounded-lg focus:outline-none focus:ring-0'

  if (type === 'image') {
    return (
      <FileUpload
        value={String(value || '')}
        onChange={(next) => onChange(next)}
        onUploaded={onUploadMeta}
        gen={genValue}
        returnType="filename"
        module={uploadModule}
        accept={supportToAccept('image', field.support)}
        mode={field.mode}
        disabled={readOnly}
      />
    )
  }

  if (type === 'video') {
    return (
      <VideoUpload
        value={String(value || '')}
        onChange={(next) => onChange(next)}
        onUploaded={onUploadMeta}
        gen={genValue}
        returnType="filename"
        module={uploadModule}
        accept={supportToAccept('video', field.support)}
        disabled={readOnly}
      />
    )
  }

  if (type === 'file') {
    return (
      <FileTypeUpload
        value={String(value || '')}
        onChange={(next) => onChange(next)}
        onUploaded={onUploadMeta}
        gen={genValue}
        returnType="filename"
        module={uploadModule}
        accept={supportToAccept('file', field.support)}
        disabled={readOnly}
      />
    )
  }

  if (type === 'dropdown') {
    return (
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={baseClass}
        disabled={readOnly}
      >
        <option value="">Select...</option>
        {(field.options || []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  }

  if (type === 'switch') {
    return (
      <button
        type="button"
        onClick={() => !readOnly && onChange(!value)}
        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
          value ? 'bg-[color:var(--accent)]' : 'bg-[color:var(--border)]'
        } ${readOnly ? 'opacity-70 cursor-not-allowed' : ''}`}
        disabled={readOnly}
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
            value ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    )
  }

  if (type === 'fulltext') {
    return (
      <WysiwygEditor
        id={editorId || field.field}
        value={value || ''}
        onChange={onChange}
        height={320}
        readOnly={readOnly}
        module={uploadModule}
      />
    )
  }

  if (type === 'moretext') {
    return (
      <textarea
        rows={5}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={baseClass}
        {...disabledProps}
      />
    )
  }

  if (type === 'number') {
    return (
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className={baseClass}
        {...disabledProps}
      />
    )
  }

  if (type === 'email') {
    return (
      <input
        type="email"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={baseClass}
        {...disabledProps}
      />
    )
  }

  if (type === 'date') {
    return (
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={baseClass}
        {...disabledProps}
      />
    )
  }

  if (type === 'datetime') {
    return (
      <input
        type="datetime-local"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={baseClass}
        {...disabledProps}
      />
    )
  }

  return (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className={baseClass}
      {...disabledProps}
    />
  )
}

export default function ChildListField({ field, value, onChange, readOnly = false, uploadModule = 'article', onEditorOpenChange }: ChildListFieldProps) {
  const rows = useMemo(() => normalizeRows(value), [value])
  const customColumns = field.childConfig?.columns || []
  const selectAllRef = useRef<HTMLInputElement>(null)

  const dataColumns = useMemo(() => {
    const effectiveColumns = customColumns.length > 0 ? customColumns : defaultColumns(rows)

    return effectiveColumns.map((column) => ({
      key: column.key,
      label: column.label,
      width: column.width,
      render: (raw: any) => {
        if (column.type === 'date' && raw) return new Date(raw).toLocaleDateString()
        if (column.type === 'datetime' && raw) return new Date(raw).toLocaleString()
        return raw || '-'
      },
    }))
  }, [customColumns, rows])

  const editorFields = useMemo(() => {
    if (field.childConfig?.fields && field.childConfig.fields.length > 0) return field.childConfig.fields
    return defaultFields((customColumns.length > 0 ? customColumns : defaultColumns(rows)).map((column) => ({
      key: column.key,
      label: column.label,
      type: column.type,
    })))
  }, [customColumns, field.childConfig?.fields, rows])

  const [openEditor, setOpenEditor] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [draft, setDraft] = useState<Record<string, any>>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [selectedKeys, setSelectedKeys] = useState<Set<number>>(new Set())
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; rowIndex: number } | null>(null)

  useEffect(() => {
    onEditorOpenChange?.(openEditor)
    return () => onEditorOpenChange?.(false)
  }, [onEditorOpenChange, openEditor])

  const openCreate = () => {
    const initial = editorFields.reduce<Record<string, any>>((acc, item) => {
      if (item.defaultValue !== undefined) {
        acc[item.field] = item.defaultValue
      } else {
        acc[item.field] = item.type === 'switch' ? false : ''
      }
      return acc
    }, {})
    setDraft(initial)
    setEditingIndex(null)
    setValidationErrors({})
    setOpenEditor(true)
  }

  const openEdit = (row: any, index: number) => {
    setDraft({ ...row })
    setEditingIndex(index)
    setValidationErrors({})
    setOpenEditor(true)
  }

  const removeRow = useCallback((index: number) => {
    const nextRows = rows.filter((_, idx) => idx !== index)
    onChange(nextRows)
    setSelectedKeys((prev) => {
      const next = new Set<number>()
      Array.from(prev).forEach((key) => {
        if (key === index) return
        next.add(key > index ? key - 1 : key)
      })
      return next
    })
  }, [onChange, rows])

  const handleToggleSelect = useCallback((rowIndex: number) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(rowIndex)) next.delete(rowIndex)
      else next.add(rowIndex)
      return next
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (!rows.length) return
    const allSelected = rows.every((_, idx) => selectedKeys.has(idx))
    if (allSelected) {
      setSelectedKeys(new Set())
      return
    }
    setSelectedKeys(new Set(rows.map((_, idx) => idx)))
  }, [rows, selectedKeys])

  useEffect(() => {
    if (!selectAllRef.current) return
    const allSelected = rows.length > 0 && rows.every((_, idx) => selectedKeys.has(idx))
    const someSelected = rows.some((_, idx) => selectedKeys.has(idx))
    selectAllRef.current.checked = allSelected
    selectAllRef.current.indeterminate = !allSelected && someSelected
  }, [rows, selectedKeys])

  useEffect(() => {
    setSelectedKeys((prev) => {
      const next = new Set<number>()
      Array.from(prev).forEach((idx) => {
        if (idx >= 0 && idx < rows.length) next.add(idx)
      })
      return next
    })
  }, [rows.length])

  const handleRowMenuClick = useCallback((rowIndex: number, event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    const rect = event.currentTarget.getBoundingClientRect()
    setContextMenu({ x: rect.right - 180, y: rect.bottom, rowIndex })
  }, [])

  const columns = useMemo(() => {
    const selectColumn = {
      key: '__select',
      label: '',
      width: 52,
      align: 'center' as const,
      sticky: 'left' as const,
      renderHeader: () => (
        <input
          ref={selectAllRef}
          type="checkbox"
          onChange={handleSelectAll}
          onDoubleClick={(e) => e.stopPropagation()}
          className="w-4 h-4 shrink-0 rounded accent-[color:var(--accent)] text-[color:var(--accent)] focus:ring-0 focus:outline-none border-none shadow-none cursor-pointer"
          aria-label="Select all child rows"
        />
      ),
      render: (_: any, row: any) => {
        const rowIndex = row.__rowIndex
        return (
          <input
            type="checkbox"
            checked={selectedKeys.has(rowIndex)}
            onChange={() => handleToggleSelect(rowIndex)}
            onDoubleClick={(e) => e.stopPropagation()}
            className="w-4 h-4 shrink-0 rounded accent-[color:var(--accent)] text-[color:var(--accent)] focus:ring-0 focus:outline-none border-none shadow-none cursor-pointer"
            aria-label="Select child row"
          />
        )
      },
    }

    const menuColumn = {
      key: '__menu',
      label: '',
      width: 56,
      align: 'center' as const,
      sticky: 'right' as const,
      render: (_: any, row: any) => (
        <button
          type="button"
          onClick={(e) => handleRowMenuClick(row.__rowIndex, e)}
          onDoubleClick={(e) => e.stopPropagation()}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[color:var(--border)] text-[color:var(--text-muted)]"
          aria-label="Child row actions"
        >
          <i className="fas fa-ellipsis-v" />
        </button>
      ),
    }

    return [selectColumn, ...dataColumns, menuColumn]
  }, [dataColumns, handleRowMenuClick, handleSelectAll, handleToggleSelect, selectedKeys])

  const closeEditor = () => {
    setOpenEditor(false)
    setEditingIndex(null)
    setDraft({})
    setValidationErrors({})
  }

  const isEmptyValue = (value: any): boolean => {
    if (value === null || value === undefined) return true
    if (typeof value === 'string' && value.trim() === '') return true
    if (Array.isArray(value) && value.length === 0) return true
    return false
  }

  const validateDraft = () => {
    const nextErrors: Record<string, string> = {}

    for (const editorField of editorFields) {
      if (!editorField.required) continue
      const rawValue = draft[editorField.field]
      if (isEmptyValue(rawValue)) {
        nextErrors[editorField.field] = `${editorField.name || toLabel(editorField.field)} is required`
      }
    }

    setValidationErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const saveEditor = () => {
    if (!validateDraft()) return

    const nextRows = [...rows]

    if (editingIndex === null) {
      nextRows.push(draft)
    } else {
      nextRows[editingIndex] = draft
    }

    onChange(nextRows)
    closeEditor()
  }

  const editorRows = groupFields(editorFields)
  const selectedCount = selectedKeys.size

  const handleDeleteSelected = useCallback(() => {
    if (selectedKeys.size === 0) return
    const nextRows = rows.filter((_, idx) => !selectedKeys.has(idx))
    onChange(nextRows)
    setSelectedKeys(new Set())
  }, [onChange, rows, selectedKeys])

  const contextItems: ContextMenuItem[] = useMemo(() => {
    if (!contextMenu) return []

    const row = rows[contextMenu.rowIndex]
    if (!row) return []

    const items: ContextMenuItem[] = []

    if (!readOnly) {
      items.push({
        label: 'Edit',
        onClick: () => openEdit(row, contextMenu.rowIndex),
      })
      items.push({
        label: 'Delete',
        className: 'text-[color:var(--danger)]',
        onClick: () => removeRow(contextMenu.rowIndex),
      })
    }

    if (items.length === 0) {
      items.push({
        label: 'Open',
        onClick: () => openEdit(row, contextMenu.rowIndex),
      })
    }

    return items
  }, [contextMenu, openEdit, readOnly, removeRow, rows])

  const footerRow = !readOnly && selectedCount > 0 ? (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <span className="text-sm text-[color:var(--text-muted)]">
        Selected {selectedCount} item{selectedCount > 1 ? 's' : ''}
      </span>
      <button type="button" className="btn btn-danger" onClick={handleDeleteSelected}>
        Delete
      </button>
    </div>
  ) : null

  const emptyState = readOnly ? (
    <span>No content available.</span>
  ) : (
    <span>No content yet. Click "Add" to create content.</span>
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-sm text-[color:var(--text-muted)]">{rows.length} item(s)</span>
        {!readOnly && (
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            Add
          </button>
        )}
      </div>

      <Table
        columns={columns}
        data={rows.map((item, index) => ({ ...item, __rowIndex: index }))}
        tableMinWidth={760}
        minHeight={320}
        emptyState={emptyState}
        footerRow={footerRow}
        footerPinnedBottom
        onRowDoubleClick={(row) => {
          if (readOnly) return
          const index = row.__rowIndex
          if (typeof index === 'number') {
            openEdit(rows[index], index)
          }
        }}
      />

      {contextMenu && contextItems.length > 0 && (
        <ContextMenu
          items={contextItems}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}

      {openEditor && (
        <div
          className="fixed top-[var(--nav-height)] right-0 bottom-0 left-0 lg:left-64 z-50 overflow-y-auto !mt-0"
          style={{
            background:
              'radial-gradient(circle at 20% 20%, rgba(0, 0, 0, 0.05), transparent 26%), radial-gradient(circle at 80% 10%, rgba(0, 0, 0, 0.04), transparent 24%), var(--bg)',
          }}
        >
          <div className="px-4 pb-5 pt-0 sm:px-6 lg:px-10">
            <div className="max-w-7xl mx-auto w-full min-h-[calc(100vh-var(--nav-height)-2.5rem)]">
              <div className="fixed top-0 left-0 right-0 bg-[color:var(--card)] border-b border-[color:var(--border)] shadow-sm px-3 sm:px-6 h-14" style={{ zIndex: 60 }}>
                <div className="flex items-center justify-between h-full max-w-7xl mx-auto gap-2">
                  <span className="text-sm text-[color:var(--text-muted)] hidden sm:inline">You have unsaved changes</span>
                  <div className="flex gap-2 ml-auto">
                    <button type="button" onClick={closeEditor} className="btn btn-secondary">
                      Cancel
                    </button>
                    <button type="button" onClick={saveEditor} className="btn btn-primary">
                      Save
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {field.childConfig?.title || field.name || field.field || 'Child Form'}
                    </h2>
                    <p className="text-[color:var(--text-muted)] text-sm">
                      {editingIndex === null ? 'Create new child item' : `Editing child item #${editingIndex + 1}`}
                    </p>
                  </div>
              </div>

                <div className="bg-[color:var(--card)] p-6 rounded-lg border border-[color:var(--border)] h-fit">
                  <h3 className="text-lg font-semibold mb-4">Detail</h3>
                  <div className="space-y-4">
                    {editorRows.map((row, idx) => (
                      <div key={idx} style={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
                        {row.map((editorField) => (
                          <div
                            key={editorField.field}
                            style={{
                              width: `${editorField.width ?? 100}%`,
                              padding: '0 0.25rem',
                              boxSizing: 'border-box',
                            }}
                          >
                            <label className="block text-sm font-medium mb-2">
                              {editorField.name || toLabel(editorField.field)}
                              {editorField.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            <div className={validationErrors[editorField.field] ? 'p-3 bg-red-50 border border-red-300 rounded-lg' : ''}>
                              {renderEditorInput(
                                editorField,
                                draft[editorField.field],
                                (nextValue) => {
                                  setDraft((prev) => ({ ...prev, [editorField.field]: nextValue }))
                                  setValidationErrors((prev) => {
                                    if (!prev[editorField.field]) return prev
                                    const next = { ...prev }
                                    delete next[editorField.field]
                                    return next
                                  })
                                },
                                false,
                                uploadModule,
                                getGenValue(draft, editorField.field),
                                (meta) => {
                                  setDraft((prev) => {
                                    const snakeGen = `${editorField.field}_gen`
                                    const camelGen = toCamelCase(snakeGen)
                                    return {
                                      ...prev,
                                      [snakeGen]: String(meta?.gen || ''),
                                      [camelGen]: String(meta?.gen || ''),
                                    }
                                  })
                                },
                                `child-${editingIndex ?? 'new'}-${editorField.field}`
                              )}
                            </div>
                            {validationErrors[editorField.field] && (
                              <p className="text-red-500 text-xs mt-1">{validationErrors[editorField.field]}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
