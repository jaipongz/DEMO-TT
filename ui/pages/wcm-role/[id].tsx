import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import { api } from '../../utils/api'

const fetcher = (url: string) => api.get(url).then(r => r.data)

type Permission = {
  id: number
  module: string
  module_name?: string
  moduleName?: string
  action: string
}

const ACTION_ORDER = ['view', 'modify', 'delete', 'publish', 'export']

const ACTION_ALIASES: Record<string, string[]> = {
  view: ['view', 'read'],
  modify: ['modify', 'update', 'edit', 'create'],
  delete: ['delete', 'remove'],
  publish: ['publish', 'published'],
  export: ['export'],
}

const ACTION_LABELS: Record<string, string> = {
  view: 'View',
  modify: 'Modify',
  delete: 'Delete',
  publish: 'Publish',
  export: 'Export',
}

const normalizeAction = (action: string) => {
  const raw = String(action || '').trim().toLowerCase()
  if (!raw) return ''

  for (const [target, aliases] of Object.entries(ACTION_ALIASES)) {
    if (aliases.includes(raw)) return target
  }

  return raw
}

export default function RoleDetail() {
  const router = useRouter()
  const { id } = router.query
  const isNew = id === 'new'

  const { data: role, isLoading, error } = useSWR(isNew ? null : `/wcm-roles/${id}`, fetcher)
  const { data: permissionsData } = useSWR('/wcm-permissions', fetcher)
  const permissions: Permission[] = Array.isArray(permissionsData) ? permissionsData : []

  const [formData, setFormData] = useState({ name: '', description: '', permissionIds: [] as number[] })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name || '',
        description: role.description || '',
        permissionIds: Array.isArray(role.permissions) ? role.permissions.map((item: any) => Number(item.id)).filter((value: number) => Number.isInteger(value) && value > 0) : [],
      })
    } else if (isNew) {
      setFormData({ name: '', description: '', permissionIds: [] })
    }
  }, [role, isNew])

  const actionKeys = useMemo(() => {
    const discovered = new Set<string>()
    permissions.forEach((permission) => {
      const normalized = normalizeAction(permission.action)
      if (normalized) discovered.add(normalized)
    })

    const ordered = ACTION_ORDER.filter((key) => discovered.has(key))
    const extras = Array.from(discovered).filter((key) => !ACTION_ORDER.includes(key)).sort((left, right) => left.localeCompare(right))
    return [...ordered, ...extras]
  }, [permissions])

  const groupedPermissions = useMemo(() => {
    const moduleMap = new Map<string, Map<string, Permission>>()
    const moduleLabelMap = new Map<string, string>()

    permissions.forEach((permission) => {
      const moduleKey = String(permission.module || '').trim() || 'general'
      const moduleLabel = String(permission.module_name || permission.moduleName || moduleKey).trim() || moduleKey
      const actionKey = normalizeAction(permission.action)
      if (!actionKey) return

      if (!moduleMap.has(moduleKey)) {
        moduleMap.set(moduleKey, new Map())
        moduleLabelMap.set(moduleKey, moduleLabel)
      }

      moduleMap.get(moduleKey)!.set(actionKey, permission)
    })

    return Array.from(moduleMap.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([moduleKey, actionMap]) => ({ moduleKey, moduleName: moduleLabelMap.get(moduleKey) || moduleKey, actionMap }))
  }, [permissions])

  const isChecked = (permissionId: number) => formData.permissionIds.includes(permissionId)

  const togglePermission = (permissionId: number, checked: boolean) => {
    setFormData((prev) => {
      const next = new Set(prev.permissionIds)
      if (checked) {
        next.add(permissionId)
      } else {
        next.delete(permissionId)
      }
      return {
        ...prev,
        permissionIds: Array.from(next),
      }
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        permissionIds: formData.permissionIds,
      }

      if (isNew) {
        await api.post('/wcm-roles', payload)
        setMessage('Role created successfully!')
        setTimeout(() => router.push('/wcm-role'), 1500)
      } else {
        await api.put(`/wcm-roles/${id}`, payload)
        setMessage('Role updated successfully!')
        setTimeout(() => router.push('/wcm-role'), 1500)
      }
    } catch (err: any) {
      setMessage('Error: ' + (err.response?.data?.message || 'Failed to save'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!isNew && isLoading) return <div className="p-6">Loading...</div>
  if (!isNew && error) return <div className="p-6 text-red-600">Error loading role</div>

  const roleDisplay = String(formData.name || id || '').trim()

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <nav className="text-sm text-[color:var(--text-muted)]" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 flex-wrap">
            <li>
              <Link href="/wcm-role" className="hover:text-[color:var(--accent)]">Roles</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-[color:var(--text)] font-medium">{isNew ? 'Create' : roleDisplay || 'Detail'}</li>
          </ol>
        </nav>
        <button
          type="button"
          onClick={() => router.push('/wcm-role')}
          className="btn btn-secondary"
        >
          Back to list
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <section className="card rounded-xl border border-[color:var(--border)] p-4 sm:p-5 space-y-4">
          <h2 className="text-lg font-semibold">Detail</h2>

          <div>
            <label className="block text-sm font-medium mb-2">Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[color:var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description <span className="text-red-500">*</span></label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              required
              className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[color:var(--accent)]"
            />
          </div>
        </section>

        <section className="card rounded-xl border border-[color:var(--border)] p-4 sm:p-5 space-y-3">
          <h2 className="text-lg font-semibold">Assigned permission</h2>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[740px] border-collapse">
              <thead>
                <tr className="border-b border-[color:var(--border)] text-left text-sm text-[color:var(--text-muted)]">
                  <th className="py-2 pr-4 font-medium">Module</th>
                  <th className="py-2 font-medium">Permission</th>
                </tr>
              </thead>
              <tbody>
                {groupedPermissions.map(({ moduleKey, moduleName, actionMap }) => (
                  <tr key={moduleKey} className="border-b border-[color:var(--border)] align-top">
                    <td className="py-4 pr-4 font-medium">{moduleName}</td>
                    <td className="py-4">
                      <div className="flex flex-wrap gap-x-8 gap-y-3">
                        {actionKeys.map((actionKey) => {
                          const matched = actionMap.get(actionKey)
                          const label = ACTION_LABELS[actionKey] || actionKey
                          const disabled = !matched
                          return (
                            <label key={`${moduleKey}-${actionKey}`} className={`inline-flex items-center gap-2 ${disabled ? 'opacity-40' : ''}`}>
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded accent-[color:var(--accent)]"
                                checked={matched ? isChecked(matched.id) : false}
                                disabled={disabled}
                                onChange={(event) => {
                                  if (!matched) return
                                  togglePermission(matched.id, event.target.checked)
                                }}
                              />
                              <span>{label}</span>
                            </label>
                          )
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
                {groupedPermissions.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-6 text-sm text-[color:var(--text-muted)]">No permissions found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="sticky bottom-0 z-30 px-4 sm:px-6 border-t border-[color:var(--border)] bg-[color:var(--card)]/95 backdrop-blur" style={{ height: 'var(--nav-height)' }}>
          <div className="flex h-full w-full items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
