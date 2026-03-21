import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import useSWR from 'swr'
import { api } from '../../utils/api'
import DynamicFormBox from './DynamicFormBox'
import { FormConfig, FormField, validateFormFields } from '../../types/formConfig'
import { langLookup, langOptions } from '../../config/core'
import CustomSelect from '../core/CustomSelect'
import SaveActionBar from './SaveActionBar'
import OperationErrorPage, { extractApiErrorMessage } from '../core/OperationErrorPage'
import ConfirmDialog from '../core/ConfirmDialog'
import Toast from '../core/Toast'
import type { SiteSettings } from '../../types/siteSettings'
import { useAuth } from '../../context/AuthContext'
import { hasModuleAction, resolveModuleKey } from '../../utils/permissions'

const langAliases = ['obj_lang']
const workflowStateAliases = ['obj_state']

function parseDateAsUtc(rawValue: any): Date | null {
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

function normalizeStateValue(value: any): string {
  const raw = String(value || '').toLowerCase()
  if (!raw) return 'draft'
  if (raw === 'publish' || raw === 'published') return 'published'
  if (raw === 'archived' || raw === 'unpublished') return 'unpublish'
  if (raw === 'draft' || raw === 'unpublish') return raw
  return 'draft'
}

function normalizeForDirtyComparison(value: any): any {
  if (value === undefined || value === null || value === '') return null

  if (Array.isArray(value)) {
    const normalized = value
      .map((item) => normalizeForDirtyComparison(item))
      .filter((item) => item !== null)
    return normalized.length > 0 ? normalized : null
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value)
      .map(([key, item]) => [key, normalizeForDirtyComparison(item)] as const)
      .filter(([, item]) => item !== null)
      .sort(([a], [b]) => a.localeCompare(b))

    if (entries.length === 0) return null

    return Object.fromEntries(entries)
  }

  return value
}

function isEquivalentValue(left: any, right: any): boolean {
  const normalizedLeft = normalizeForDirtyComparison(left)
  const normalizedRight = normalizeForDirtyComparison(right)
  return JSON.stringify(normalizedLeft) === JSON.stringify(normalizedRight)
}

function hasFormChanges(current: Record<string, any>, initial: Record<string, any>): boolean {
  const keys = new Set([...Object.keys(current || {}), ...Object.keys(initial || {})])
  for (const key of keys) {
    if (!isEquivalentValue(current?.[key], initial?.[key])) {
      return true
    }
  }
  return false
}

function toCamelCase(input: string): string {
  return String(input || '')
    .replace(/[-_]+([a-zA-Z0-9])/g, (_, char: string) => String(char).toUpperCase())
    .replace(/^([A-Z])/, (char: string) => char.toLowerCase())
}

function toSnakeCase(input: string): string {
  return String(input || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase()
}

function toGalleryFieldKey(boxLabel: string): string {
  return `__gallery_${toSnakeCase(boxLabel || 'gallery')}`
}

function resolveDetailFieldKey(field: FormField, boxLabel: string, rowIdx: number, fieldIdx: number): string {
  if (field.field) return field.field

  const base =
    field.childConfig?.title ||
    field.name ||
    boxLabel ||
    `child_${rowIdx}_${fieldIdx}`

  return `__child_${toSnakeCase(base)}_${rowIdx}_${fieldIdx}`
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

function getValueByAliases(payload: Record<string, any>, fieldName: string): any {
  const aliases = Array.from(new Set([fieldName, toCamelCase(fieldName), toSnakeCase(fieldName)]))
  for (const key of aliases) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      return payload[key]
    }
  }

  for (const collectionAlias of getDynamicCollectionAliasKeys(fieldName)) {
    const collectionAliases = Array.from(new Set([
      collectionAlias,
      toCamelCase(collectionAlias),
      toSnakeCase(collectionAlias),
    ]))
    for (const key of collectionAliases) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        return payload[key]
      }
    }
  }

  return undefined
}

function getFirstDefinedValue(payload: Record<string, any>, keys: string[]): any {
  for (const key of keys) {
    const value = getValueByAliases(payload, key)
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value
    }
  }
  return undefined
}

function getModuleDisplayName(endpointKey: string, title?: string): string {
  const rawTitle = String(title || '').trim()
  if (rawTitle) {
    const stripped = rawTitle.replace(/^(create|edit|view)\s+/i, '').trim()
    if (stripped) return stripped
  }

  return String(endpointKey || 'module')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

interface GenericDetailFormProps {
  id: string | string[] | undefined
  endpoint: string
  isNew: boolean
  formConfig: FormConfig
  initialData?: Record<string, any>
  title?: string
  subtitle?: string
  readOnly?: boolean
  showBottomSaveBar?: boolean
}

type RevisionItem = {
  obj_rev?: number
  rev?: number
  obj_lang?: string
  lang?: string
  obj_status?: string
  status?: string
  obj_state?: string
  state?: string
  obj_modified_by_name?: string
  modified_by_name?: string
  modified_by?: number | string
  obj_modified_date?: string
  modified_date?: string
  is_active?: boolean
}

type NormalizedRevisionItem = {
  rev: number
  lang: string
  status: string
  state: string
  modifiedByName: string
  modifiedDateRaw: string
  isActive: boolean
}

function normalizeRevisionItem(item: RevisionItem): NormalizedRevisionItem {
  const rev = Number(item?.obj_rev ?? item?.rev ?? 0)
  const lang = String(item?.obj_lang ?? item?.lang ?? '').trim()
  const status = String(item?.obj_status ?? item?.status ?? '').trim()
  const state = String(item?.obj_state ?? item?.state ?? '').trim()
  const modifiedByName = String(
    item?.obj_modified_by_name ?? item?.modified_by_name ?? item?.modified_by ?? '-'
  ).trim() || '-'
  const modifiedDateRaw = String(item?.obj_modified_date ?? item?.modified_date ?? '').trim()
  const isActive = Boolean(item?.is_active)

  return {
    rev,
    lang,
    status,
    state,
    modifiedByName,
    modifiedDateRaw,
    isActive,
  }
}

export default function GenericDetailForm({
  id,
  endpoint,
  isNew,
  formConfig,
  initialData,
  title,
  subtitle,
  readOnly = false,
  showBottomSaveBar = true,
}: GenericDetailFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const endpointKey = String(endpoint || '').replace(/^\/+/, '').split('/')[0]
  const moduleKey = resolveModuleKey(endpoint)
  const canModify = hasModuleAction(user, moduleKey, ['create', 'modify', 'update'])
  const canDelete = hasModuleAction(user, moduleKey, ['delete', 'remove'])
  const canPublish = hasModuleAction(user, moduleKey, ['publish'])
  const uploadModule = endpointKey.replace(/-/g, '_') || 'article'
  const defaultLang = langOptions[0]?.value || ''
  const stateOptions = [
    {
      label: 'Published',
      value: 'published',
      badgeClassName: 'bg-green-100 text-green-700',
      iconClassName: 'fas fa-check-circle',
    },
    {
      label: 'Draft',
      value: 'draft',
      badgeClassName: 'bg-yellow-100 text-yellow-700',
      iconClassName: 'fas fa-pen',
    },
    {
      label: 'Unpublish',
      value: 'unpublish',
      badgeClassName: 'bg-gray-100 text-gray-700',
      iconClassName: 'fas fa-ban',
    },
  ]
  const langActionOptions = langOptions.map((item) => {
    const key = String(item.value || '').toLowerCase()
    const normalized = key.includes('-') ? key.split('-')[0] : key
    const meta = langLookup[key] || langLookup[normalized]
    return {
      value: item.value,
      label: item.label,
      flag: meta?.flag,
      emoji: meta?.icon,
    }
  })
  const defaultState = 'draft'
  const masterField = String(formConfig.master_field || '').trim()
  const availableFields = formConfig.box.flatMap((box, boxIdx) => {
    if ('fields' in box) {
      return box.fields
        .map((field, fieldIdx) => resolveDetailFieldKey(field, box.label, boxIdx, fieldIdx))
        .filter((field): field is string => Boolean(field))
    }
    if (box.type === 'gallery') {
      return [box.field || toGalleryFieldKey(box.label)]
    }
    return [] as string[]
  })
  const stateField = workflowStateAliases.find((field) => availableFields.includes(field)) || 'obj_state'
  const listHref = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const moduleName = getModuleDisplayName(endpointKey, title)

  const getLangFromPayload = (payload?: Record<string, any>) => {
    const value = langAliases
      .map((field) => payload?.[field])
      .find((lang) => lang !== undefined && lang !== null && lang !== '')
    return String(value || defaultLang)
  }

  const withLangAliases = (payload: Record<string, any>, nextLang: string) => {
    const normalizedLang = String(nextLang || defaultLang)
    const updated = { ...payload }
    updated.obj_lang = normalizedLang
    return updated
  }

  const getStateFromPayload = (payload?: Record<string, any>) => {
    const raw = workflowStateAliases
      .map((field) => payload?.[field])
      .find((value) => value !== undefined && value !== null && value !== '')
    return normalizeStateValue(raw || defaultState)
  }

  const withStateAliases = (payload: Record<string, any>, nextState: string) => {
    const normalizedState = normalizeStateValue(nextState)
    const updated = { ...payload }
    updated.obj_state = normalizedState
    return updated
  }

  const ensureDefaults = (payload?: Record<string, any>) => {
    const withLang = withLangAliases({ ...(payload || {}) }, getLangFromPayload(payload))
    return withStateAliases(withLang, getStateFromPayload(withLang))
  }

  const { data, isLoading, error, mutate } = useSWR(isNew ? null : `${endpoint}/${id}`, (url) =>
    api.get(url).then((r) => r.data)
  )

  const [formData, setFormData] = useState<Record<string, any>>(ensureDefaults(initialData))
  const [initialFormData, setInitialFormData] = useState<Record<string, any>>(ensureDefaults(initialData))
  const [isDirty, setIsDirty] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [childEditorOpen, setChildEditorOpen] = useState(false)
  const [actionMenuOpen, setActionMenuOpen] = useState(false)
  const [revisionOpen, setRevisionOpen] = useState(false)
  const [revisionDiffFields, setRevisionDiffFields] = useState<Record<string, boolean>>({})
  const [revisionPreviewLoading, setRevisionPreviewLoading] = useState(false)
  const [revisionPreviewKey, setRevisionPreviewKey] = useState<string>('')
  const [timezone, setTimezone] = useState('Asia/Bangkok')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTitle, setConfirmTitle] = useState('')
  const [confirmDescription, setConfirmDescription] = useState('')
  const [confirmLabel, setConfirmLabel] = useState('Confirm')
  const [confirmAction, setConfirmAction] = useState<null | (() => Promise<void> | void)>(null)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const actionMenuRef = useRef<HTMLDivElement | null>(null)
  const isRevisionMode = Boolean(revisionPreviewKey)
  const effectiveReadOnly = readOnly || isRevisionMode || !canModify

  const revisionKey = !isNew && revisionOpen ? `${endpoint}/${id}/revisions` : null
  const {
    data: revisionResponse,
    isLoading: revisionLoading,
    error: revisionError,
  } = useSWR(revisionKey, (url) => api.get(url).then((r) => r.data))

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastType(type)
    setToastMessage(text)
    setToastOpen(true)
  }

  const openConfirm = (
    titleText: string,
    descriptionText: string,
    action: () => Promise<void> | void,
    actionLabel = 'Confirm',
  ) => {
    setConfirmTitle(titleText)
    setConfirmDescription(descriptionText)
    setConfirmLabel(actionLabel)
    setConfirmAction(() => action)
    setConfirmOpen(true)
  }

  const handleConfirmAccept = async () => {
    const action = confirmAction
    setConfirmOpen(false)
    setConfirmAction(null)
    if (!action) return
    await action()
  }

  useEffect(() => {
    const source = data || (isNew ? initialData : undefined)
    if (data) {
      const normalized = ensureDefaults(source)
      setFormData(normalized)
      setInitialFormData(normalized)
      setIsDirty(false)
      setRevisionDiffFields({})
      setRevisionPreviewKey('')
    } else if (isNew) {
      const normalized = ensureDefaults(source)
      setFormData(normalized)
      setInitialFormData(normalized)
      setIsDirty(false)
      setRevisionDiffFields({})
      setRevisionPreviewKey('')
    }
  }, [data, isNew, initialData, stateField])

  useEffect(() => {
    setIsDirty(hasFormChanges(formData, initialFormData))
  }, [formData, initialFormData])

  const collectDiffFields = (currentPayload: Record<string, any>, comparePayload: Record<string, any>) => {
    const diffMap: Record<string, boolean> = {}

    for (const fieldName of availableFields) {
      if (!fieldName) continue
      const left = getValueByAliases(currentPayload, fieldName)
      const right = getValueByAliases(comparePayload, fieldName)
      if (!isEquivalentValue(left, right)) {
        diffMap[fieldName] = true
      }
    }

    return diffMap
  }

  const handleSelectRevision = async (item: RevisionItem) => {
    if (isNew || !id) return
    const normalizedItem = normalizeRevisionItem(item)
    const rev = Number(normalizedItem.rev)
    if (!Number.isInteger(rev) || rev <= 0) return

    setRevisionPreviewLoading(true)
    setMessage('')

    try {
      const lang = String(normalizedItem.lang || getLangFromPayload(initialFormData || formData) || '').trim()
      const query = lang ? `?lang=${encodeURIComponent(lang)}` : ''
      const response = await api.get(`${endpoint}/${id}/revisions/${rev}${query}`)
      const snapshotRaw = (response?.data || {}) as Record<string, any>
      const snapshot = ensureDefaults(snapshotRaw)
      const baseline = ensureDefaults(initialFormData || {})
      const diffMap = collectDiffFields(baseline, snapshot)

      setFormData(snapshot)
      setRevisionDiffFields(diffMap)
      setRevisionPreviewKey(`${rev}:${lang}`)
    } catch (err: any) {
      setMessage('Error: ' + (err?.response?.data?.message || 'Failed to load revision snapshot'))
    } finally {
      setRevisionPreviewLoading(false)
    }
  }

  const clearRevisionPreview = () => {
    setFormData(initialFormData)
    setRevisionDiffFields({})
    setRevisionPreviewKey('')
    setRevisionOpen(false)
  }

  const applyRevisionAsLatest = async () => {
    if (!isRevisionMode || isNew) return

    const ok = await save(getStateFromPayload(formData), {
      payloadOverride: formData,
      skipValidation: true,
      redirectAfterSave: false,
      successMessage: 'Revision applied as latest version.',
      silentSuccess: false,
    })

    if (!ok) return

    await mutate()
    setRevisionDiffFields({})
    setRevisionPreviewKey('')
    setRevisionOpen(false)
    showToast('success', 'Revision applied as latest version.')
  }

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

  useEffect(() => {
    if (!actionMenuOpen) return

    const handleOutsideClick = (event: MouseEvent) => {
      if (!actionMenuRef.current) return
      if (!actionMenuRef.current.contains(event.target as Node)) {
        setActionMenuOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActionMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [actionMenuOpen])

  const handleChange = (fieldName: string, value: any) => {
    if (effectiveReadOnly) return
    setFormData((prev) => {
      const updated = langAliases.includes(fieldName)
        ? withLangAliases(prev, String(value))
        : workflowStateAliases.includes(fieldName)
        ? withStateAliases(prev, String(value))
        : { ...prev, [fieldName]: value }
      return updated
    })
  }

  const withLatestRichTextValues = (source: Record<string, any>) => {
    if (typeof window === 'undefined') return source
    const tiny = (window as any).tinymce
    if (!tiny || !Array.isArray(tiny.editors)) return source

    const next = { ...source }
    const fulltextFields = formConfig.box.flatMap((box) => {
      if (!('fields' in box)) return [] as string[]
      return box.fields
        .filter((field) => field.type === 'fulltext' && !!field.field)
        .map((field) => String(field.field))
    })

    for (const fieldName of fulltextFields) {
      const matched = tiny.editors.find(
        (editor: any) => editor?.id === fieldName || String(editor?.id || '').startsWith(`${fieldName}-`)
      )
      if (matched && typeof matched.getContent === 'function') {
        next[fieldName] = matched.getContent()
      }
    }

    return next
  }

  const sanitizeRichTextPayload = (source: Record<string, any>) => {
    const next = { ...source }
    const fulltextFields = formConfig.box.flatMap((box) => {
      if (!('fields' in box)) return [] as string[]
      return box.fields
        .filter((field) => field.type === 'fulltext' && !!field.field)
        .map((field) => String(field.field))
    })

    for (const fieldName of fulltextFields) {
      // Keep only the canonical field value (e.g. "content") in request payload.
      delete next[`${fieldName}Html`]
      delete next[`${fieldName}Plain`]
      delete next[`${fieldName}_html`]
      delete next[`${fieldName}_plain`]
    }

    return next
  }

  const save = async (
    nextState?: string,
    options?: {
      payloadOverride?: Record<string, any>
      skipValidation?: boolean
      redirectAfterSave?: boolean
      successMessage?: string
      silentSuccess?: boolean
    }
  ): Promise<boolean> => {
    if (readOnly) return false
    setMessage('')
    setValidationErrors({})

    const baseSource = options?.payloadOverride ? { ...options.payloadOverride } : withLatestRichTextValues({ ...formData })
    const base = sanitizeRichTextPayload(baseSource)
    const payload = nextState
      ? withStateAliases(base, nextState)
      : withStateAliases(base, getStateFromPayload(base))
    const payloadWithLang = withLangAliases(payload, getLangFromPayload(payload))
    const shouldRedirect = options?.redirectAfterSave ?? true

    if (!options?.skipValidation) {
      const validation = validateFormFields(formConfig, payloadWithLang)
      if (!validation.valid) {
        setValidationErrors(validation.errors)
        const errorList = Object.values(validation.errors).join(', ')
        setMessage(`Error: ${errorList}`)
        return false
      }
    }

    setSubmitting(true)

    try {
      if (isNew) {
        await api.post(endpoint, payloadWithLang)
        setFormData(payloadWithLang)
        setInitialFormData(payloadWithLang)
        setIsDirty(false)
        if (shouldRedirect) {
          setTimeout(() => router.push(endpoint), 1500)
        }
      } else {
        await api.put(`${endpoint}/${id}`, payloadWithLang)
        setFormData(payloadWithLang)
        setInitialFormData(payloadWithLang)
        setIsDirty(false)
        if (shouldRedirect) {
          setTimeout(() => router.push(endpoint), 1500)
        }
      }
      return true
    } catch (err: any) {
      setMessage('Error: ' + (err.response?.data?.message || 'Failed to save'))
      return false
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    openConfirm(
      'Are you sure you want to save?',
      'The current changes will be saved to this item.',
      async () => {
        const ok = await save()
        if (ok) showToast('success', 'Saved successfully.')
      },
      'Confirm',
    )
  }

  const handleSaveDraft = async () => {
    openConfirm(
      'Are you sure you want to save as draft?',
      'This item will be saved and remain in draft status.',
      async () => {
        const ok = await save('draft')
        if (ok) showToast('success', 'Saved as draft.')
      },
      'Confirm',
    )
  }

  const handleSavePublish = async () => {
    if (!canPublish) return
    openConfirm(
      'Are you sure you want to publish?',
      'Setting items as publish will make them available on the website.',
      async () => {
        const ok = await save('published')
        if (ok) showToast('success', 'Published successfully.')
      },
      'Confirm',
    )
  }

  const handleActionLangChange = async (value: string) => {
    if (effectiveReadOnly) return
    openConfirm(
      'Are you sure you want to change language?',
      'The selected language will be applied and saved.',
      async () => {
        const updated = withLangAliases({ ...formData }, value)
        setFormData(updated)
        setInitialFormData(updated)
        setIsDirty(false)

        if (isNew) {
          showToast('success', 'Language updated.')
          return
        }

        const ok = await save(undefined, {
          payloadOverride: updated,
          skipValidation: true,
          redirectAfterSave: true,
          silentSuccess: true,
        })
        if (ok) showToast('success', 'Language updated.')
      },
      'Confirm',
    )
  }

  const handleActionStateChange = async (value: string) => {
    if (!canPublish) return
    if (effectiveReadOnly) return
    openConfirm(
      'Are you sure you want to change state?',
      'The selected state will be applied and saved.',
      async () => {
        const updated = withStateAliases({ ...formData }, value)
        setFormData(updated)
        setInitialFormData(updated)
        setIsDirty(false)

        if (isNew) {
          showToast('success', 'State updated.')
          return
        }

        const ok = await save(undefined, {
          payloadOverride: updated,
          skipValidation: true,
          redirectAfterSave: true,
          silentSuccess: true,
        })
        if (ok) showToast('success', 'State updated.')
      },
      'Confirm',
    )
  }

  const handleCancel = () => {
    if (!isDirty) {
      router.back()
      return
    }

    openConfirm(
      'Discard unsaved changes?',
      'Your unsaved edits will be removed.',
      () => {
        setFormData(initialFormData)
        setValidationErrors({})
        setMessage('')
        setIsDirty(false)
      },
      'Confirm',
    )
  }

  if (!isNew && isLoading) return <div className="p-6">Loading...</div>
  if (!isNew && error) {
    return (
      <div className="p-6">
        <OperationErrorPage message={extractApiErrorMessage(error) || 'Error loading data'} />
      </div>
    )
  }

  const currentLang = getLangFromPayload(formData)
  const rawMasterValue = masterField ? getValueByAliases(formData, masterField) : ''
  const masterValue = String(rawMasterValue ?? '').trim()
  const displayMasterValue = masterValue || '-'
  const detailHeading = isNew
    ? (title || 'Create')
    : effectiveReadOnly
    ? (title || `View ${displayMasterValue}`)
    : `Edit ${displayMasterValue}`
  const detailSubheading = subtitle || (isNew ? 'Create a new record' : '')
  const breadcrumbDetailLabel = isNew ? 'Create' : displayMasterValue
  const modifiedBy = String(
    getFirstDefinedValue(formData, ['obj_modified_by_name', 'obj_modified_by', 'updated_by_name', 'updated_by']) || '-',
  )
  const modifiedAtRaw = getFirstDefinedValue(formData, ['obj_modified_date', 'updated_at'])
  const modifiedDate = parseDateAsUtc(modifiedAtRaw)
  let modifiedAt = '-'
  if (modifiedDate) {
    const resolvedTimezone = timezone || 'Asia/Bangkok'
    const hour12 = resolvedTimezone === 'Asia/Bangkok' ? false : undefined

    try {
      const dateText = modifiedDate.toLocaleDateString(undefined, {
        timeZone: resolvedTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      const timeText = modifiedDate.toLocaleTimeString(undefined, {
        timeZone: resolvedTimezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12,
      })
      modifiedAt = `${dateText}, ${timeText}`
    } catch {
      const dateText = modifiedDate.toLocaleDateString(undefined, {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      const timeText = modifiedDate.toLocaleTimeString(undefined, {
        timeZone: 'Asia/Bangkok',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
      modifiedAt = `${dateText}, ${timeText}`
    }
  }
  const detailActionItems = [
    { label: 'Duplicate new item', icon: 'far fa-clone', action: 'duplicate-item' },
    { label: 'Duplicate new language', icon: 'fas fa-language', action: 'duplicate-language' },
    { label: 'Revision', icon: 'fas fa-history', action: 'revision' },
    ...(canDelete ? [{ label: 'Delete', icon: 'far fa-trash-alt', danger: true, action: 'delete' }] : []),
  ]

  const revisionPayload = revisionResponse as { activeRevision?: number; items?: RevisionItem[] } | undefined
  const revisionItems = Array.isArray(revisionPayload?.items) ? revisionPayload!.items : []
  const activeRevision = Number((revisionResponse as any)?.activeRevision ?? (revisionResponse as any)?.active_revision)

  const groupedRevisions = revisionItems.reduce((acc, item) => {
    const normalizedItem = normalizeRevisionItem(item)
    const parsed = parseDateAsUtc(normalizedItem.modifiedDateRaw)
    const monthKey = parsed
      ? parsed.toLocaleDateString(undefined, { timeZone: timezone || 'Asia/Bangkok', year: 'numeric', month: 'long' })
      : 'Unknown'

    if (!acc[monthKey]) acc[monthKey] = []
    acc[monthKey].push({ item, normalizedItem, parsed })
    return acc
  }, {} as Record<string, Array<{ item: RevisionItem; normalizedItem: NormalizedRevisionItem; parsed: Date | null }>>)

  return (
    <div className="px-6 pb-6 pt-0">
      <SaveActionBar
        isVisible={!readOnly && !isRevisionMode && isDirty && !childEditorOpen}
        submitting={submitting}
        showPublishAction={canPublish}
        onCancel={handleCancel}
        onSaveDraft={handleSaveDraft}
        onSavePublish={handleSavePublish}
      />

      <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
        <nav className="text-sm text-[color:var(--text-muted)]" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 flex-wrap">
            <li>
              <Link href={listHref} className="hover:text-[color:var(--accent)]">
                {moduleName}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-[color:var(--text)] font-medium">{breadcrumbDetailLabel}</li>
          </ol>
        </nav>
        <div ref={actionMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setActionMenuOpen((prev) => !prev)}
            className={`h-10 w-10 rounded-md flex items-center justify-center transition-colors border ${
              actionMenuOpen
                ? 'bg-[color:var(--card)] text-[color:var(--text)] border-[color:var(--border)]'
                : 'bg-[color:var(--bg)] text-[color:var(--text)] border-transparent hover:bg-[color:var(--card)] hover:border-[color:var(--border)]'
            } focus-visible:bg-[color:var(--card)] focus-visible:text-[color:var(--text)] focus-visible:border-[color:var(--border)]`}
            aria-label="Open detail actions"
            aria-expanded={actionMenuOpen}
          >
            <i className="fas fa-ellipsis-h" />
          </button>

          {actionMenuOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] shadow-xl z-50 overflow-hidden">
              <div className="py-2">
                {detailActionItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      if (item.action === 'revision') {
                        setRevisionOpen(true)
                      }
                      setActionMenuOpen(false)
                    }}
                    className={`w-full px-4 py-2 text-sm text-left flex items-center gap-3 hover:bg-[color:var(--bg-alt)] ${item.danger ? 'text-[color:var(--danger)]' : 'text-[color:var(--text)]'}`}
                  >
                    <i className={`${item.icon} w-4 text-center`} aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="border-t border-[color:var(--border)] px-4 py-3 bg-[color:var(--bg-alt)]/40">
                <p className="text-xs text-[color:var(--text-muted)] mb-1">Modified</p>
                <p className="text-sm font-medium text-[color:var(--text)] truncate">{modifiedBy}</p>
                <p className="text-xs text-[color:var(--text-muted)] mt-1 inline-flex items-center gap-1">
                  <span>{modifiedAt}</span>
                  <i className="far fa-clock" aria-hidden="true" />
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {revisionOpen && (
        <>
          <button
            type="button"
            aria-label="Close revision panel"
            className="fixed inset-0 z-40 bg-black/10"
            onClick={clearRevisionPreview}
          />
          <aside className="fixed right-0 top-0 z-50 h-screen w-full max-w-sm border-l border-[color:var(--border)] bg-[color:var(--card)] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--border)]">
              <h2 className="text-lg font-semibold">Revision</h2>
              <button
                type="button"
                onClick={clearRevisionPreview}
                className="h-8 w-8 rounded border border-[color:var(--border)] text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
                aria-label="Close"
              >
                <i className="fas fa-times" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {revisionLoading && <p className="text-sm text-[color:var(--text-muted)]">Loading revisions...</p>}
              {revisionError && <p className="text-sm text-[color:var(--danger)]">Failed to load revisions.</p>}
              {!revisionLoading && !revisionError && revisionItems.length === 0 && (
                <p className="text-sm text-[color:var(--text-muted)]">No revision history.</p>
              )}

              {Object.entries(groupedRevisions).map(([month, rows]) => (
                <section key={month}>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)] mb-2">{month}</h3>
                  <div className="space-y-2">
                    {rows.map(({ item, normalizedItem, parsed }, index) => {
                      const previewKey = `${Number(normalizedItem.rev || 0)}:${String(normalizedItem.lang || '')}`
                      const isPreviewed = revisionPreviewKey === previewKey
                      const isActive = normalizedItem.isActive || (Number.isFinite(activeRevision) && Number(normalizedItem.rev) === Number(activeRevision))
                      const dateText = parsed
                        ? parsed.toLocaleDateString(undefined, {
                            timeZone: timezone || 'Asia/Bangkok',
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                          })
                        : '--/--/--'
                      const timeText = parsed
                        ? parsed.toLocaleTimeString(undefined, {
                            timeZone: timezone || 'Asia/Bangkok',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })
                        : '--:--'

                      return (
                        <article
                          key={`${month}-${normalizedItem.rev || index}-${normalizedItem.modifiedDateRaw || index}`}
                          onClick={() => handleSelectRevision(item)}
                          className={`rounded border px-3 py-2 ${
                            isPreviewed
                              ? 'border-[#97C8C2] bg-[#97C8C2]/20'
                              : isActive
                              ? 'border-teal-300 bg-teal-50/40'
                              : 'border-[color:var(--border)] bg-[color:var(--card)]'
                          } cursor-pointer`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[color:var(--text)] truncate">{normalizedItem.modifiedByName}</p>
                              <p className="text-xs text-[color:var(--text-muted)]">
                                {dateText} <i className="far fa-clock" aria-hidden="true" /> {timeText}
                              </p>
                              <p className="text-[11px] mt-1 text-[color:var(--text-muted)]">
                                Rev {normalizedItem.rev || '-'} • {normalizedItem.state || '-'} • {normalizedItem.status || '-'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                handleSelectRevision(item)
                              }}
                              className="h-7 w-7 rounded border border-[color:var(--border)] text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
                              aria-label="Revision action"
                            >
                              <i className="fas fa-history" />
                            </button>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>

            <div className="border-t border-[color:var(--border)] p-3 flex items-center justify-end gap-2">
              {revisionPreviewLoading && <span className="text-xs text-[color:var(--text-muted)] mr-auto">Loading selected revision...</span>}
              <button type="button" className="btn btn-secondary" onClick={clearRevisionPreview}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  openConfirm(
                    'Are you sure you want to apply this revision?',
                    'Applying this revision will create a new latest version with the selected data.',
                    applyRevisionAsLatest,
                    'Confirm',
                  )
                }
                disabled={!isRevisionMode || revisionPreviewLoading || submitting}
              >
                Revision
              </button>
            </div>
          </aside>
        </>
      )}

      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{detailHeading}</h1>
          {detailSubheading && <p className="text-[color:var(--text-muted)] text-sm">{detailSubheading}</p>}
        </div>
        <div className="flex gap-3">
          <div className="w-44">
            <CustomSelect
              value={currentLang}
              onChange={(val) => handleActionLangChange(String(val))}
              options={langActionOptions}
              placeholder="Language"
              disabled={effectiveReadOnly}
              triggerClassName="h-10"
            />
          </div>
          {canPublish && (
            <div className="w-36">
              <CustomSelect
                value={getStateFromPayload(formData)}
                onChange={(val) => handleActionStateChange(String(val))}
                options={stateOptions}
                placeholder="State"
                disabled={effectiveReadOnly}
                triggerClassName="h-10"
              />
            </div>
          )}
        </div>
      </div>

      {message && message.includes('Error') && (
        <div className="mb-4 p-3 rounded-lg text-sm bg-red-100 text-red-700">
          {message.includes('Error:') ? (
            <div>
              <p className="font-semibold mb-2">Validation errors:</p>
              <ul className="list-disc list-inside space-y-1">
                {Object.values(validationErrors).map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div>{message}</div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0' }}>
          {formConfig.box.map((box, boxIndex) => (
            <div key={`${box.label}-${boxIndex}`} style={{ width: `${box.width}%`, padding: '0.5rem' }}>
              <div style={{ height: '100%' }}>
                <DynamicFormBox
                  box={box}
                  formData={formData}
                  onChange={handleChange}
                  uploadModule={uploadModule}
                  validationErrors={validationErrors}
                  readOnly={effectiveReadOnly}
                  onChildEditorOpenChange={setChildEditorOpen}
                  diffHighlightedFields={revisionDiffFields}
                />
              </div>
            </div>
          ))}
        </div>

        {!readOnly && !isRevisionMode && showBottomSaveBar && !childEditorOpen && (
          <div
            className="sticky bottom-0 z-30 px-4 sm:px-6 border-t border-[color:var(--border)] bg-[color:var(--card)]/95 backdrop-blur"
            style={{ height: 'var(--nav-height)' }}
          >
            <div className="flex h-full w-full flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-[color:var(--text-muted)] hidden sm:inline">Form actions</span>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-end sm:justify-start">
                <button type="button" onClick={handleCancel} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel={confirmLabel}
        onConfirm={handleConfirmAccept}
        onCancel={() => {
          setConfirmOpen(false)
          setConfirmAction(null)
        }}
        loading={submitting || revisionPreviewLoading}
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
