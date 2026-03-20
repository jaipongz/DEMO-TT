type PermissionLike = {
  name?: string
  module?: string
  action?: string
}

type RoleLike = {
  name?: string
  permissions?: PermissionLike[]
}

type UserLike = {
  roles?: Array<RoleLike | string>
  permissions?: PermissionLike[]
}

const MODULE_ALIASES: Record<string, string> = {
  articles: 'article',
  article: 'article',
  home_banner: 'home_banner',
  'home-banner': 'home_banner',
  demo_jp: 'demo_jp',
  'demo-jp': 'demo_jp',
  'wcm-user': 'user',
  wcm_user: 'user',
  users: 'user',
  user: 'user',
  'wcm-role': 'role',
  wcm_role: 'role',
  roles: 'role',
  role: 'role',
  'site-settings': 'site-setting',
  site_settings: 'site-setting',
  'site-setting': 'site-setting',
  'wcm-site-setting': 'site-setting',
  wcm_site_setting: 'site-setting',
  permissions: 'permission',
  permission: 'permission',
  'wcm-permission': 'permission',
  wcm_permission: 'permission',
}

const ACTION_ALIASES: Record<string, string[]> = {
  view: ['view', 'read', 'open', 'list'],
  modify: ['modify', 'update', 'edit', 'create', 'write'],
  delete: ['delete', 'remove'],
  publish: ['publish', 'published', 'unpublish', 'state', 'status'],
  export: ['export'],
}

function normalizeToken(value: string): string {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '-')
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function addPermissionCandidates(target: string[], moduleInput: string, actionInput: string): void {
  const moduleKey = resolveModuleKey(moduleInput)
  const actionKey = normalizeAction(actionInput)
  if (!moduleKey || !actionKey) return

  target.push(`${moduleKey}.${actionKey}`)
}

function addPermissionNameCandidates(target: string[], permissionName: string): void {
  const raw = String(permissionName || '').trim().toLowerCase()
  if (!raw) return

  target.push(raw)

  const dotIndex = raw.indexOf('.')
  if (dotIndex <= 0 || dotIndex >= raw.length - 1) return

  const modulePart = raw.slice(0, dotIndex)
  const actionPart = raw.slice(dotIndex + 1)
  addPermissionCandidates(target, modulePart, actionPart)
}

function isAdminRoleName(value: string): boolean {
  const normalized = normalizeToken(value)
  return normalized === 'admin' || normalized === 'super-admin' || normalized === 'superadmin'
}

function hasAdminAccess(user?: UserLike | null): boolean {
  if (!user || !Array.isArray(user.roles)) return false

  return user.roles.some((role) => {
    if (!role) return false
    if (typeof role === 'string') return isAdminRoleName(role)
    return isAdminRoleName(String(role.name || ''))
  })
}

export function resolveModuleKey(input: string): string {
  const raw = String(input || '').trim().replace(/^\/+/, '').split('?')[0]
  const firstSegment = raw.split('/')[0]
  const normalized = normalizeToken(firstSegment)
  if (!normalized) return ''
  return MODULE_ALIASES[normalized] || normalized.replace(/^wcm-/, '')
}

export function normalizeAction(input: string): string {
  const raw = normalizeToken(input)
  if (!raw) return ''

  for (const [target, aliases] of Object.entries(ACTION_ALIASES)) {
    if (aliases.includes(raw)) return target
  }

  return raw
}

export function inferActionFromLabel(label: string): string {
  const text = String(label || '').trim().toLowerCase()
  if (!text) return ''

  if (text.includes('delete') || text.includes('remove')) return 'delete'
  if (text.includes('export')) return 'export'
  if (text.includes('publish') || text.includes('unpublish') || text.includes('state') || text.includes('status')) return 'publish'
  if (text.includes('edit') || text.includes('modify') || text.includes('update')) return 'modify'
  if (text.includes('open') || text.includes('view')) return 'view'

  return ''
}

export function collectPermissionNames(user?: UserLike | null): string[] {
  if (!user) return []
  if (hasAdminAccess(user)) return ['*']

  const names: string[] = []

  if (Array.isArray(user.permissions)) {
    user.permissions.forEach((permission) => {
      if (!permission) return
      addPermissionNameCandidates(names, String(permission.name || ''))
      addPermissionCandidates(names, String(permission.module || ''), String(permission.action || ''))
    })
  }

  if (Array.isArray(user.roles)) {
    user.roles.forEach((role: RoleLike | string) => {
      if (!role || typeof role === 'string') return
      if (!Array.isArray(role.permissions)) return
      role.permissions.forEach((permission) => {
        if (!permission) return
        addPermissionNameCandidates(names, String(permission.name || ''))
        addPermissionCandidates(names, String(permission.module || ''), String(permission.action || ''))
      })
    })
  }

  return dedupe(names)
}

export function hasPermission(user: UserLike | null | undefined, required: string | string[]): boolean {
  if (hasAdminAccess(user)) return true

  const list = collectPermissionNames(user)
  if (list.length === 0) return false

  const requiredList = Array.isArray(required) ? required : [required]
  const normalized = requiredList.map((item) => String(item || '').trim().toLowerCase()).filter(Boolean)
  if (normalized.length === 0) return true

  return normalized.some((permission) => list.includes(permission))
}

export function hasModuleAction(user: UserLike | null | undefined, moduleKey: string, action: string | string[]): boolean {
  const module = resolveModuleKey(moduleKey)
  if (!module) return false

  const actions = (Array.isArray(action) ? action : [action]).map((item) => normalizeAction(item)).filter(Boolean)
  if (actions.length === 0) return false

  return hasPermission(
    user,
    actions.map((item) => `${module}.${item}`),
  )
}

export function canAccessModule(user: UserLike | null | undefined, moduleKey: string): boolean {
  if (hasAdminAccess(user)) return true

  const module = resolveModuleKey(moduleKey)
  if (!module) return false

  const directActions = ['view', 'read', 'list']
  if (hasModuleAction(user, module, directActions)) return true

  const allPermissions = collectPermissionNames(user)
  return allPermissions.some((item) => item.startsWith(`${module}.`))
}
