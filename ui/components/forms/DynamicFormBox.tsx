'use client'

import { useEffect, useMemo, useState } from 'react'
import { FormBox, FormField, calculateGridLayout, supportToAccept } from '../../types/formConfig'
import FileUpload from '../core/FileUpload'
import VideoUpload from '../core/VideoUpload'
import FileTypeUpload from '../core/FileTypeUpload'
import WysiwygEditor from '../core/WysiwygEditor'
import DatePicker from '../core/DatePicker'
import CustomSelect from '../core/CustomSelect'
import MultiSelectTag from '../core/MultiSelectTag'
import ChildListField from './ChildListField'
import ChildGalleryField from './ChildGalleryField'
import { fetchLookupOptions } from '../../utils/lookup'

function toCamelCase(input: string): string {
  return input
    .replace(/[-_]+([a-zA-Z0-9])/g, (_, char: string) => String(char).toUpperCase())
    .replace(/^([A-Z])/, (char: string) => char.toLowerCase())
}

function toSnakeCase(input: string): string {
  return String(input || '')
    .replace(/[\s-]+/g, '_')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()
}

function toKebabCase(input: string): string {
  return toSnakeCase(input).replace(/_/g, '-')
}

function resolveFieldKey(field: FormField, boxLabel: string, rowIdx: number, fieldIdx: number): string {
  if (field.field) return field.field

  const base =
    field.childConfig?.title ||
    field.name ||
    boxLabel ||
    `child_${rowIdx}_${fieldIdx}`

  return `__child_${toSnakeCase(base)}_${rowIdx}_${fieldIdx}`
}

function toGalleryFieldKey(boxLabel: string): string {
  return `__gallery_${toSnakeCase(boxLabel || 'gallery')}`
}

function resolveImageMode(mode: FormField['mode']) {
  if (!mode) return undefined
  if ('mode' in mode) return undefined
  return mode
}

function getAliasKeys(fieldName: string): string[] {
  const aliases = [
    fieldName,
    toCamelCase(fieldName),
    toSnakeCase(fieldName),
    toKebabCase(fieldName),
  ]
  return Array.from(new Set(aliases))
}

function getDynamicCollectionAliasKeys(fieldName: string): string[] {
  const aliases: string[] = []

  if (fieldName.startsWith('__gallery_')) {
    const base = toSnakeCase(fieldName.replace(/^__gallery_/, ''))
    aliases.push(base)
    if (base.endsWith('_list')) aliases.push(base.slice(0, -5))
  }

  if (fieldName.startsWith('__child_')) {
    const raw = toSnakeCase(fieldName.replace(/^__child_/, ''))
    const withoutIndex = raw.replace(/_\d+_\d+$/, '')
    aliases.push(withoutIndex)

    if (withoutIndex.endsWith('_list')) {
      aliases.push(withoutIndex.slice(0, -5))
    } else {
      aliases.push(`${withoutIndex}_list`)
    }
  }

  return Array.from(new Set(aliases.filter(Boolean)))
}

function getFormValue(data: Record<string, any>, fieldName: string): any {
  for (const key of getAliasKeys(fieldName)) {
    if (data[key] !== undefined) return data[key]
  }

  for (const key of getDynamicCollectionAliasKeys(fieldName)) {
    for (const aliasKey of getAliasKeys(key)) {
      if (data[aliasKey] !== undefined) return data[aliasKey]
    }
  }

  if (fieldName === 'document') {
    if (data.file !== undefined) return data.file
    if (data.fileName !== undefined) return data.fileName
  }

  if (fieldName === 'thumbnail') {
    if (data.thumbnailName !== undefined) return data.thumbnailName
  }

  return undefined
}

function getFormGenValue(data: Record<string, any>, fieldName: string): string {
  const genField = `${fieldName}_gen`
  for (const key of getAliasKeys(genField)) {
    const value = data[key]
    if (value !== undefined && value !== null) return String(value)
  }

  if (fieldName === 'document') {
    const fallback = data.file_gen ?? data.fileGen
    if (fallback !== undefined && fallback !== null) return String(fallback)
  }

  return ''
}

interface DynamicFormBoxProps {
  box: FormBox
  formData: Record<string, any>
  onChange: (field: string, value: any) => void
  uploadModule?: string
  validationErrors?: Record<string, string>
  readOnly?: boolean
  onChildEditorOpenChange?: (open: boolean) => void
  diffHighlightedFields?: Record<string, boolean>
}

function renderFieldByType(
  field: FormField,
  value: any,
  onChange: (value: any) => void,
  uploadModule: string,
  readOnly: boolean,
  editorId?: string,
  genValue?: string,
  onUploadMeta?: (meta: { url: string; gen: string; fileName?: string } | null) => void,
  onChildEditorOpenChange?: (open: boolean) => void,
  diffHighlighted?: boolean,
) {
  const baseInputClass = 'w-full px-3 py-2 border border-[color:var(--border)] rounded-lg focus:outline-none focus:ring-0'
  const diffInputClass = diffHighlighted ? ' revision-diff-input' : ''
  const disabledClass = readOnly ? ' bg-[color:var(--bg-alt)] text-[color:var(--text-muted)] cursor-not-allowed' : ''
  const disabledProps = readOnly ? { disabled: true } : {}
  const readOnlyProps = readOnly ? { disabled: true, readOnly: true as const } : {}

  switch (field.type) {
    case 'text':
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass + disabledClass + diffInputClass}
          {...readOnlyProps}
        />
      )

    case 'email':
      return (
        <input
          type="email"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass + disabledClass + diffInputClass}
          {...readOnlyProps}
        />
      )

    case 'number':
      return (
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          inputMode="numeric"
          pattern="[0-9]*"
          className={baseInputClass + disabledClass + diffInputClass}
          {...readOnlyProps}
        />
      )

    case 'color':
      return (
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className={`h-10 w-16 rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-alt)] p-1${readOnly ? ' opacity-70 cursor-not-allowed' : ''}${diffInputClass}`}
          {...readOnlyProps}
        />
      )

    case 'image':
      return (
        <FileUpload
          value={value}
          onChange={onChange}
          onUploaded={onUploadMeta}
          gen={genValue}
          returnType="filename"
          module={uploadModule}
          accept={supportToAccept('image', field.support)}
          mode={resolveImageMode(field.mode)}
          disabled={readOnly}
        />
      )

    case 'video':
      return (
        <VideoUpload
          value={value}
          onChange={onChange}
          onUploaded={onUploadMeta}
          gen={genValue}
          returnType="filename"
          module={uploadModule}
          accept={supportToAccept('video', field.support)}
          disabled={readOnly}
        />
      )

    case 'file':
      return (
        <FileTypeUpload
          value={value}
          onChange={onChange}
          onUploaded={onUploadMeta}
          gen={genValue}
          returnType="filename"
          module={uploadModule}
          accept={supportToAccept('file', field.support)}
          disabled={readOnly}
        />
      )

    case 'dropdown':
      return (
        <CustomSelect
          value={value || ''}
          onChange={(val) => onChange(val)}
          options={field.options || []}
          placeholder="Select..."
          searchable={!!field.search}
          disabled={readOnly}
          triggerClassName={diffHighlighted ? 'revision-diff-input' : undefined}
        />
      )

    case 'multiselect':
    case 'tag':
      return (
        <MultiSelectTag
          value={typeof value === 'string' ? value : Array.isArray(value) ? value.join(',') : ''}
          onChange={onChange}
          options={(field.options || []).map((item) => ({ value: String(item.value), label: item.label }))}
          placeholder="Select..."
          searchable={field.search !== false}
          disabled={readOnly}
        />
      )

    case 'moretext':
      return (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={8}
          className={baseInputClass + disabledClass + diffInputClass}
          {...readOnlyProps}
        />
      )

    case 'fulltext':
      return (
        <WysiwygEditor
          id={editorId || field.field}
          value={value || ''}
          onChange={onChange}
          height={400}
          readOnly={readOnly}
          module={uploadModule}
        />
      )

    case 'date':
      return (
        <DatePicker
          value={value || ''}
          onChange={onChange}
          type="date"
          disabled={readOnly}
          triggerClassName={diffHighlighted ? 'revision-diff-input' : undefined}
        />
      )

    case 'datetime':
      return (
        <DatePicker
          value={value || ''}
          onChange={onChange}
          type="datetime"
          disabled={readOnly}
          triggerClassName={diffHighlighted ? 'revision-diff-input' : undefined}
        />
      )

    case 'switch':
      const switchOptions = field.options && field.options.length >= 2
        ? field.options
        : [
            { label: 'ON', value: 'true' },
            { label: 'OFF', value: 'false' },
          ]

      const onOption = switchOptions[0]
      const offOption = switchOptions[1]
      const usesCustomSwitchOptions = !!(field.options && field.options.length >= 2)
      const isOn = usesCustomSwitchOptions
        ? String(value ?? '') === String(onOption.value)
        : Boolean(value)

      return (
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => {
              const nextValue = isOn
                ? (usesCustomSwitchOptions ? offOption.value : false)
                : (usesCustomSwitchOptions ? onOption.value : true)
              onChange(nextValue)
            }}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              isOn
                ? 'bg-[color:var(--accent)] shadow-lg'
                : 'bg-[color:var(--border)]'
            } ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}${diffInputClass}`}
            disabled={readOnly}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                isOn ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="ml-3 text-sm font-medium">{isOn ? onOption.label : offOption.label}</span>
        </div>
      )

    case 'radio':
      return (
        <div className="space-y-2">
          {field.options?.map((opt) => (
            <label key={opt.value} className="flex items-center cursor-pointer">
              <input
                type="radio"
                name={field.field}
                value={opt.value}
                checked={value === opt.value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-4 h-4 accent-[color:var(--accent)] text-[color:var(--accent)] border-[color:var(--border)]${diffInputClass}`}
                disabled={readOnly}
              />
              <span className="ml-2 text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      )

    case 'checkbox':
      return (
        <div className="space-y-2">
          {field.options?.map((opt) => (
            <label key={opt.value} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                value={opt.value}
                checked={(value || []).includes(opt.value)}
                onChange={(e) => {
                  const checked = e.target.checked
                  const newValue = Array.isArray(value) ? value : []
                  if (checked) {
                    onChange([...newValue, opt.value])
                  } else {
                    onChange(newValue.filter((v: any) => v !== opt.value))
                  }
                }}
                className="w-4 h-4 accent-[color:var(--accent)] text-[color:var(--accent)] border-[color:var(--border)] rounded"
                style={diffHighlighted ? { outline: '2px solid rgba(151, 200, 194, 0.45)' } : undefined}
                disabled={readOnly}
              />
              <span className="ml-2 text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      )

    case 'child':
      return (
        <ChildListField
          field={field}
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
          readOnly={readOnly}
          uploadModule={uploadModule}
          onEditorOpenChange={onChildEditorOpenChange}
        />
      )

    case 'gallery':
      return (
        <ChildGalleryField
          field={field}
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
          readOnly={readOnly}
          uploadModule={uploadModule}
        />
      )

    default:
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass + diffInputClass}
        />
      )
  }
}

export default function DynamicFormBox({ box, formData, onChange, uploadModule = 'article', validationErrors = {}, readOnly = false, onChildEditorOpenChange, diffHighlightedFields = {} }: DynamicFormBoxProps) {
  const normalizedFields: FormField[] = useMemo(() => {
    if ('fields' in box) return box.fields

    if (box.type === 'gallery') {
      return [
        {
          type: 'gallery',
          field: box.field || toGalleryFieldKey(box.label),
          name: box.name || box.label,
          width: 100,
          support: box.support,
          mode: box.mode,
          maxSize: box.maxSize,
        },
      ]
    }

    return []
  }, [box])

  const rows = useMemo(() => calculateGridLayout(normalizedFields), [normalizedFields])
  const [lookupOptions, setLookupOptions] = useState<Record<string, Array<{ label: string; value: string }>>>({})
  const lookupLang = useMemo(() => {
    const candidates = ['obj_lang']
    for (const key of candidates) {
      const value = getFormValue(formData, key)
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        return String(value).trim()
      }
    }
    return ''
  }, [formData])

  useEffect(() => {
    let cancelled = false

    const lookupTargets = rows
      .flatMap((row, rowIdx) =>
        row.map((field, fieldIdx) => ({
          field,
          fieldKey: resolveFieldKey(field, box.label, rowIdx, fieldIdx),
        })),
      )
      .filter(({ field }) =>
        (field.type === 'dropdown' || field.type === 'radio' || field.type === 'checkbox' || field.type === 'multiselect' || field.type === 'tag') &&
        !field.options?.length &&
        (field.lookup?.endpoint || field.lookup?.module),
      )

    if (!lookupTargets.length) {
      setLookupOptions({})
      return
    }

    const loadLookups = async () => {
      const entries = await Promise.all(
        lookupTargets.map(async ({ field, fieldKey }) => {
          try {
            const result = await fetchLookupOptions({
              ...field.lookup!,
              lang: lookupLang || field.lookup?.lang,
            })
            return [
              fieldKey,
              result.map((item) => ({ value: String(item.value), label: item.label })),
            ] as const
          } catch {
            return [fieldKey, []] as const
          }
        }),
      )

      if (cancelled) return
      setLookupOptions(Object.fromEntries(entries))
    }

    loadLookups()

    return () => {
      cancelled = true
    }
  }, [box.label, rows, lookupLang])

  return (
    <div className="bg-[color:var(--card)] p-6 rounded-lg border border-[color:var(--border)] h-fit">
      <h3 className="text-lg font-semibold mb-4">{box.label}</h3>

      <div className="space-y-4">
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} style={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
            {row.map((field, fieldIdx) => {
              const fieldKey = resolveFieldKey(field, box.label, rowIdx, fieldIdx)
              const fieldLabel = field.name || field.field || field.childConfig?.title || 'Child'
              const dynamicOptions = lookupOptions[fieldKey]
              const resolvedField = dynamicOptions
                ? { ...field, options: dynamicOptions }
                : field
              const shouldShowFieldLabel = field.type !== 'child' && field.type !== 'gallery'
              const isDiffHighlighted = getAliasKeys(fieldKey).some((key) => Boolean(diffHighlightedFields[key]))

              return (
                <div
                  key={`${fieldKey}-${rowIdx}-${fieldIdx}`}
                  style={{
                    width: `${field.width}%`,
                    padding: '0 0.25rem',
                    boxSizing: 'border-box'
                  }}
                >
                  {shouldShowFieldLabel && (
                    <label className="block text-sm font-medium mb-2">
                      {fieldLabel}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                  )}
                  <div className={validationErrors[fieldKey] ? 'p-3 bg-red-50 border border-red-300 rounded-lg' : (isDiffHighlighted ? 'revision-diff-scope rounded-lg p-2' : '')}>
                    {renderFieldByType(resolvedField, getFormValue(formData, fieldKey), (value) => {
                      if (readOnly) return
                      onChange(fieldKey, value)
                    }, uploadModule, readOnly, `${fieldKey}-${rowIdx}-${fieldIdx}`, getFormGenValue(formData, fieldKey), (meta) => {
                      if (readOnly) return
                      const nextGen = meta?.gen || ''
                      const snakeGen = `${fieldKey}_gen`
                      const camelGen = toCamelCase(snakeGen)
                      onChange(snakeGen, nextGen)
                      onChange(camelGen, nextGen)

                      if (field.type === 'image') {
                        const fileName = String(meta?.fileName || '')
                        const alt = fileName ? fileName.replace(/\.[^/.]+$/, '') : ''
                        const snakeAlt = `${fieldKey}_alt`
                        const camelAlt = toCamelCase(snakeAlt)
                        onChange(snakeAlt, alt)
                        onChange(camelAlt, alt)
                      }
                    }, onChildEditorOpenChange, isDiffHighlighted)}
                  </div>
                  {validationErrors[fieldKey] && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors[fieldKey]}</p>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
