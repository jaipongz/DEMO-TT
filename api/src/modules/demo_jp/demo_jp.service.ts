import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm'
import { promises as fs } from 'fs'
import * as path from 'path'
import { DemoJp } from './demo_jp.entity'
import { DemoJpDraft } from './demo_jp-draft.entity'
import { DemoJpChild } from './demo_jp-child.entity'
import { DemoJpChildDraft } from './demo_jp-child-draft.entity'
import { DemoJpGallery } from './demo_jp-gallery.entity'
import { DemoJpGalleryDraft } from './demo_jp-gallery-draft.entity'
import { KoreaGallery } from './korea-gallery.entity'
import { KoreaGalleryDraft } from './korea-gallery-draft.entity'
import { CreateDemoJpDto } from './dto/create-demo_jp.dto'
import { UpdateDemoJpDto } from './dto/update-demo_jp.dto'
import { OMDatetime } from '../../common/utils/OMDatetime.util'
import { OMUtilts } from '../../common/utils/OMUtilts.util'

const CHILD_FIELD_KEY = '__child_demo_jp_child_list_0_0'
const GALLERY_FIELD_KEY = '__gallery_demo_jp_gallery'
const KOREA_GALLERY_FIELD_KEY = '__gallery_korea_gallery'

const CHILD_ALIASES = [CHILD_FIELD_KEY, 'child_list', 'demo_jp_child_list']

type ChildCollectionConfig = {
  key: string
  aliases: string[]
}

type GalleryCollectionConfig = {
  key: string
  aliases: string[]
}

const CHILD_COLLECTIONS: ChildCollectionConfig[] = [
  {
    key: CHILD_FIELD_KEY,
    aliases: CHILD_ALIASES,
  },
]

const GALLERY_COLLECTIONS: GalleryCollectionConfig[] = [
  {
    key: GALLERY_FIELD_KEY,
    aliases: [GALLERY_FIELD_KEY, 'gallery', 'demo_jp_gallery'],
  },
  {
    key: KOREA_GALLERY_FIELD_KEY,
    aliases: [KOREA_GALLERY_FIELD_KEY, 'korea_gallery'],
  },
]

type ChildRow = {
  title: string
  file: string | null
  fileGen: string | null
  detail: string
}

type GalleryRow = {
  file: string
  fileGen: string
  type: string
  priority: number
}

type ChildCollectionRows = Record<string, ChildRow[]>
type GalleryCollectionRows = Record<string, GalleryRow[]>

type LookupOption = {
  value: string
  label: string
}

type LookupResponse = {
  field: string
  lang: string
  options: LookupOption[]
}

type ListQueryInput = {
  page?: string | number
  pageSize?: string | number
  search?: string
  searchFields?: string | string[]
  sortField?: string
  sortDirection?: string
  filters?: Record<string, unknown>
  [key: string]: unknown
}

type NormalizedListQuery = {
  page: number
  pageSize: number
  search: string
  searchFields: string[]
  sortField: string
  sortDirection: 'ASC' | 'DESC'
  filters: Record<string, string[]>
}

type ListActionInput = {
  action?: string
  ids?: Array<string | number>
  state?: string
}

type TableLookupConfig = {
  tableName: string
  valueColumn: string
  labelColumn: string
  labelColumnByLang?: {
    th?: string
    en?: string
  }
  whereSql?: string
  langColumn?: string
  orderBy?: {
    column: string
    direction?: 'ASC' | 'DESC'
  }
}

@Injectable()
export class DemoJpService {
  private readonly logger = new Logger(DemoJpService.name)
  private readonly siteSettingsPath = path.join(process.cwd(), 'config', 'site-settings.json')
  private readonly listFieldMap: Record<string, keyof DemoJpDraft> = {
    demo_jp_id: 'demoJpId',
    title: 'title',
    email: 'email',
    age: 'age',
    category: 'category',
    province: 'province',
    article: 'article',
    status: 'status',
    obj_state: 'objState',
    obj_lang: 'objLang',
    obj_modified_date: 'objModifiedDate',
    published_at: 'publishedAt',
    obj_created_date: 'objCreatedDate',
    obj_content_id: 'objContentId',
  }

  constructor(
    @InjectRepository(DemoJp)
    private demoRepository: Repository<DemoJp>,
    @InjectRepository(DemoJpDraft)
    private draftRepository: Repository<DemoJpDraft>,
    @InjectRepository(DemoJpChild)
    private childRepository: Repository<DemoJpChild>,
    @InjectRepository(DemoJpChildDraft)
    private childDraftRepository: Repository<DemoJpChildDraft>,
    @InjectRepository(DemoJpGallery)
    private galleryRepository: Repository<DemoJpGallery>,
    @InjectRepository(DemoJpGalleryDraft)
    private galleryDraftRepository: Repository<DemoJpGalleryDraft>,
    @InjectRepository(KoreaGallery)
    private koreaGalleryRepository: Repository<KoreaGallery>,
    @InjectRepository(KoreaGalleryDraft)
    private koreaGalleryDraftRepository: Repository<KoreaGalleryDraft>,
  ) {}

  private readonly tableLookupMap: Record<string, TableLookupConfig> = {
    province: {
      tableName: 'province',
      valueColumn: 'province_id',
      labelColumn: 'title_eng',
      labelColumnByLang: {
        th: 'title_tha',
        en: 'title_eng',
      },
      whereSql: "x.province_id IS NOT NULL",
      orderBy: { column: 'province_id', direction: 'ASC' },
    },
    // Template example for next tables:
    // district: {
    //   tableName: 'district',
    //   valueColumn: 'district_id',
    //   labelColumn: 'title_eng',
    //   labelColumnByLang: { th: 'title_tha', en: 'title_eng' },
    //   whereSql: 'x.district_id IS NOT NULL',
    // },
    article:{
      tableName: 'articles_draft',
      valueColumn: 'articles_id',
      labelColumn: 'title',
      whereSql: 'x.articles_id IS NOT NULL',
      langColumn: 'obj_lang',
      orderBy: { column: 'title', direction: 'ASC' },
    },
    home_banner:{
      tableName: 'home_banner_draft',
      valueColumn: 'home_banner_id',
      labelColumn: 'title',
      whereSql: 'x.home_banner_id IS NOT NULL',
      langColumn: 'obj_lang',
      orderBy: { column: 'title', direction: 'ASC' },
    },
  }

  private resolveLang(input?: string): string {
    const raw = String(input || '').trim().toLowerCase()
    if (!raw) return ''
    if (raw.startsWith('th')) return 'th'
    if (raw.startsWith('en')) return 'en'
    return raw
  }

  private resolveLabelColumn(config: TableLookupConfig, lang: string): string {
    if (!config.labelColumnByLang) return config.labelColumn
    if (lang === 'th' && config.labelColumnByLang.th) return config.labelColumnByLang.th
    if (lang === 'en' && config.labelColumnByLang.en) return config.labelColumnByLang.en
    return config.labelColumn
  }

  private async queryTableLookup(config: TableLookupConfig, lang: string): Promise<LookupOption[]> {
    const alias = 'x'
    const labelColumn = this.resolveLabelColumn(config, lang)
    const orderByColumn = String(config.orderBy?.column || 'label').trim()
    const orderByDirection = String(config.orderBy?.direction || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC'

    const qb = this.draftRepository.manager
      .createQueryBuilder()
      .select(`${alias}.${config.valueColumn}`, 'value')
      .addSelect(`${alias}.${labelColumn}`, 'label')
      .from(config.tableName, alias)
      .where(`${alias}.${config.valueColumn} IS NOT NULL`)
      .andWhere(`${alias}.${labelColumn} IS NOT NULL`)
      .andWhere(`${alias}.${labelColumn} <> ''`)
      .limit(500)

    if (orderByColumn === 'label') {
      qb.orderBy('label', orderByDirection)
    } else if (orderByColumn === 'value') {
      qb.orderBy('value', orderByDirection)
    } else {
      qb.orderBy(`${alias}.${orderByColumn}`, orderByDirection)
    }

    if (config.whereSql && config.whereSql.trim() !== '') {
      qb.andWhere(config.whereSql)
    }

    if (config.langColumn && lang !== '') {
      qb.andWhere(`${alias}.${config.langColumn} = :lang`, { lang })
    }

    const rows = await qb.getRawMany<{ value: string | number; label: string }>()

    return rows.map((row) => ({
      value: String(row.value),
      label: String(row.label || row.value),
    }))
  }

  private extractGenFromValue(value: unknown): string | null {
    const raw = String(value || '').trim()
    if (!raw) return null

    const fromUrl = raw.match(/\/stock\/[^/]+\/([a-zA-Z0-9]{8,32})\//)
    if (fromUrl?.[1]) return fromUrl[1]

    const fromStoredName = raw.match(/^([a-zA-Z0-9]{8,32})__/)
    if (fromStoredName?.[1]) return fromStoredName[1]

    return null
  }

  private toPositiveInt(value: unknown, fallback: number): number {
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) return fallback
    const normalized = Math.floor(parsed)
    return normalized > 0 ? normalized : fallback
  }

  private parseSearchFields(input: unknown): string[] {
    if (Array.isArray(input)) {
      return input.map((item) => String(item).trim()).filter(Boolean)
    }

    const raw = String(input ?? '').trim()
    if (!raw) return []
    return raw.split(',').map((item) => item.trim()).filter(Boolean)
  }

  private parseFilters(query: ListQueryInput): Record<string, string[]> {
    const result: Record<string, string[]> = {}

    const incomingFilters = query.filters
    if (incomingFilters && typeof incomingFilters === 'object' && !Array.isArray(incomingFilters)) {
      Object.entries(incomingFilters).forEach(([key, raw]) => {
        const values = this.toStringArray(raw)
        if (values.length > 0) {
          result[key] = values
        }
      })
    }

    Object.entries(query).forEach(([key, rawValue]) => {
      if (!key.startsWith('filter_')) return
      const field = key.replace(/^filter_/, '').trim()
      if (!field) return
      const values = this.toStringArray(rawValue)
      if (values.length > 0) {
        result[field] = values
      }
    })

    return result
  }

  private normalizeQuery(query?: ListQueryInput): NormalizedListQuery {
    const page = this.toPositiveInt(query?.page, 1)
    const pageSize = Math.min(200, this.toPositiveInt(query?.pageSize, 15))
    const search = String(query?.search ?? '').trim()
    const searchFields = this.parseSearchFields(query?.searchFields)
    const sortField = String(query?.sortField || 'obj_modified_date').trim()
    const sortDirection = String(query?.sortDirection || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
    const filters = this.parseFilters(query || {})

    return {
      page,
      pageSize,
      search,
      searchFields,
      sortField,
      sortDirection,
      filters,
    }
  }

  private resolveColumn(field: string): keyof DemoJpDraft | undefined {
    const raw = String(field || '').trim()
    if (!raw) return undefined
    return this.listFieldMap[raw]
  }

  private applySearch(
    qb: SelectQueryBuilder<DemoJpDraft>,
    term: string,
    fields: string[],
  ): void {
    if (!term) return

    const resolvedColumns = fields
      .map((field) => this.resolveColumn(field))
      .filter((field): field is keyof DemoJpDraft => Boolean(field))

    const fallback = ['title', 'email', 'category', 'status']
      .map((field) => this.resolveColumn(field))
      .filter((field): field is keyof DemoJpDraft => Boolean(field))

    const targets = resolvedColumns.length > 0 ? resolvedColumns : fallback
    if (!targets.length) return

    qb.andWhere(
      new Brackets((where) => {
        targets.forEach((column, index) => {
          const clause = `LOWER(COALESCE(CAST(d.${String(column)} AS CHAR), '')) LIKE :searchTerm`
          if (index === 0) {
            where.where(clause, { searchTerm: `%${term.toLowerCase()}%` })
          } else {
            where.orWhere(clause, { searchTerm: `%${term.toLowerCase()}%` })
          }
        })
      }),
    )
  }

  private applyFilters(qb: SelectQueryBuilder<DemoJpDraft>, filters: Record<string, string[]>): void {
    Object.entries(filters).forEach(([field, values]) => {
      if (!values.length) return
      const column = this.resolveColumn(field)
      if (!column) return

      const paramName = `filter_${String(column)}`
      if (values.length === 1) {
        qb.andWhere(`d.${String(column)} = :${paramName}`, { [paramName]: values[0] })
      } else {
        qb.andWhere(`d.${String(column)} IN (:...${paramName})`, { [paramName]: values })
      }
    })
  }

  private applySort(
    qb: SelectQueryBuilder<DemoJpDraft>,
    sortField: string,
    sortDirection: 'ASC' | 'DESC',
  ): void {
    const column = this.resolveColumn(sortField) || this.resolveColumn('obj_modified_date') || 'objModifiedDate'
    qb.orderBy(`d.${String(column)}`, sortDirection)
  }

  private buildListQuery(query?: ListQueryInput): {
    qb: SelectQueryBuilder<DemoJpDraft>
    normalized: NormalizedListQuery
  } {
    const normalized = this.normalizeQuery(query)
    const qb = this.draftRepository.createQueryBuilder('d')

    qb.andWhere('d.objStatus = :activeStatus', { activeStatus: 'active' })

    this.applySearch(qb, normalized.search, normalized.searchFields)
    this.applyFilters(qb, normalized.filters)
    this.applySort(qb, normalized.sortField, normalized.sortDirection)

    return { qb, normalized }
  }

  private shouldUseServerList(query?: ListQueryInput): boolean {
    if (!query) return false

    const entries = Object.entries(query)
    if (entries.length === 0) return false

    return entries.some(([key, value]) => {
      if (value === undefined || value === null) return false
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'string') return value.trim() !== ''
      return true
    })
  }

  private stripHtmlToText(input: unknown): string {
    return String(input || '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, ' ')
      .trim()
  }

  private parseArrayValue(value: unknown): any[] | undefined {
    if (Array.isArray(value)) return value
    if (typeof value !== 'string') return undefined

    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : undefined
    } catch {
      return undefined
    }
  }

  private normalizeKey(input: string): string {
    return String(input || '').trim().toLowerCase().replace(/[\s-]+/g, '_')
  }

  private pickCollectionsByConfig<T>(
    payload: Record<string, any>,
    prefix: '__child_' | '__gallery_',
    collectionConfigs: Array<{ key: string; aliases: string[] }>,
    normalizeRows: (raw: unknown) => T[],
  ): Record<string, T[]> | undefined {
    const normalizedToKey = new Map<string, string>()

    for (const config of collectionConfigs) {
      normalizedToKey.set(this.normalizeKey(config.key), config.key)
      for (const alias of config.aliases) {
        normalizedToKey.set(this.normalizeKey(alias), config.key)
      }
    }

    const entriesByCanonical = new Map<string, T[]>()
    const register = (rawKey: string, rawValue: unknown) => {
      const parsed = this.parseArrayValue(rawValue)
      if (!parsed) return

      const normalizedKey = this.normalizeKey(rawKey)
      const canonicalKey = normalizedToKey.get(normalizedKey) || normalizedToKey.get(this.normalizeKey(`${prefix}${rawKey}`))

      if (!canonicalKey) {
        if (rawKey.startsWith(prefix)) {
          this.logger.warn(`[collections] Ignore unknown key=${rawKey}`)
        }
        return
      }

      const normalizedRows = normalizeRows(parsed)
      entriesByCanonical.set(canonicalKey, normalizedRows)
    }

    for (const config of collectionConfigs) {
      for (const alias of config.aliases) {
        if (!Object.prototype.hasOwnProperty.call(payload, alias)) continue
        register(alias, payload[alias])
      }
    }

    for (const [rawKey, rawValue] of Object.entries(payload)) {
      if (!rawKey.startsWith(prefix)) continue
      register(rawKey, rawValue)
    }

    if (entriesByCanonical.size === 0) return undefined
    return Object.fromEntries(entriesByCanonical.entries())
  }

  private normalizeMainInput(payload: Record<string, any>, mode: 'create' | 'update' = 'create') {
    const normalized = { ...payload }
    const isCreate = mode === 'create'
    const hasOwn = (key: string): boolean => Object.prototype.hasOwnProperty.call(normalized, key)
    const hasAnyKey = (...keys: string[]): boolean => keys.some((key) => hasOwn(key))
    const firstDefined = (...keys: string[]): unknown => {
      for (const key of keys) {
        if (hasOwn(key) && normalized[key] !== undefined) return normalized[key]
      }
      return undefined
    }

    const toNullableDateString = (value: unknown): string | null => {
      if (value === undefined || value === null) return null
      const raw = String(value).trim()
      return raw === '' ? null : raw
    }

    const coerceTinyInt = (value: unknown): number => {
      if (typeof value === 'boolean') return value ? 1 : 0
      const raw = String(value ?? '').trim().toLowerCase()
      if (raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on') return 1
      return 0
    }

    const toStringArray = (value: unknown): string[] => {
      if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
      if (typeof value === 'string' && value.trim()) {
        try {
          const parsed = JSON.parse(value)
          if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean)
        } catch {
          // ignore JSON parse error and fallback to comma split
        }
        return value.split(',').map((item) => item.trim()).filter(Boolean)
      }
      return []
    }

    const hasFlags = hasAnyKey('flags', 'flags_json')
    if (isCreate || hasFlags) {
      const rawFlags = firstDefined('flags', 'flags_json')
      const flagsArray = toStringArray(rawFlags)
      normalized.flagsJson = JSON.stringify(flagsArray)
    }

    const hasIsActive = hasAnyKey('is_active')
    if (isCreate || hasIsActive) {
      normalized.isActive = coerceTinyInt(normalized.is_active ?? false)
    }

    const hasTags = hasAnyKey('home_banner_tags')
    if (isCreate || hasTags) {
      const rawTags = firstDefined('home_banner_tags')
      const tagsArray = toStringArray(rawTags)
      normalized.homeBannerTags = tagsArray.length > 0 ? JSON.stringify(tagsArray) : null
    }

    const hasBrandColor = hasAnyKey('brand_color')
    if (isCreate || hasBrandColor) {
      normalized.brandColor = String(normalized.brand_color ?? '').trim() || null
    }

    const hasPublishedDate = hasAnyKey('published_date')
    if (isCreate || hasPublishedDate) {
      normalized.publishedDate = toNullableDateString(normalized.published_date)
    }

    const hasPublishedAt = hasAnyKey('published_at')
    if (isCreate || hasPublishedAt) {
      normalized.publishedAt = toNullableDateString(normalized.published_at)
    }

    const hasContent = hasAnyKey('content')
    if (isCreate || hasContent) {
      normalized.contentHtml = normalized.content ?? ''
      normalized.contentPlain = this.stripHtmlToText(normalized.contentHtml)
    }

    const hasThumbnail = hasAnyKey('thumbnail', 'thumbnail_gen', 'thumbnail_alt')
    if (isCreate || hasThumbnail) {
      normalized.thumbnail = normalized.thumbnail ?? null
      normalized.thumbnailGen = normalized.thumbnail_gen ?? this.extractGenFromValue(normalized.thumbnail) ?? null
      normalized.thumbnailAlt =
        normalized.thumbnail_alt ??
        (normalized.thumbnail ? String(normalized.thumbnail).replace(/\.[^/.]+$/, '') : null)
    }

    const hasIntroVideo = hasAnyKey('intro_video', 'intro_video_gen')
    if (isCreate || hasIntroVideo) {
      normalized.introVideo = normalized.intro_video ?? null
      normalized.introVideoGen =
        normalized.intro_video_gen ?? this.extractGenFromValue(normalized.introVideo) ?? null
    }

    const hasAttachment = hasAnyKey('attachment', 'attachment_gen')
    if (isCreate || hasAttachment) {
      normalized.attachment = normalized.attachment ?? null
      normalized.attachmentGen =
        normalized.attachment_gen ?? this.extractGenFromValue(normalized.attachment) ?? null
    }

    delete normalized.flags
    delete normalized.flags_json
    delete normalized.is_active
    delete normalized.published_date
    delete normalized.published_at
    delete normalized.brand_color
    delete normalized.content
    delete normalized.thumbnail_gen
    delete normalized.thumbnail_alt
    delete normalized.intro_video
    delete normalized.intro_video_gen
    delete normalized.attachment_gen
    delete normalized.home_banner_tags

    return normalized
  }

  private normalizeChildRows(raw: unknown): ChildRow[] {
    if (!Array.isArray(raw)) return []

    return raw
      .filter((item) => item && typeof item === 'object')
      .map((item: Record<string, any>, index) => {
        const titleRaw = String(item.title || '').trim()
        const fileRaw = String(item.file || item.filename || '').trim()
        const detailRaw = String(item.detail ?? '').trim()

        return {
          title: titleRaw || fileRaw || `Child ${index + 1}`,
          file: fileRaw || null,
          fileGen: String(item.file_gen || item.fileGen || '').trim() || this.extractGenFromValue(fileRaw) || null,
          detail: detailRaw,
        }
      })
      .filter((item) => item.title !== '' || item.file !== null || item.detail !== '')
  }

  private normalizeGalleryRows(raw: unknown): GalleryRow[] {
    if (!Array.isArray(raw)) return []

    return raw
      .filter((item) => item && typeof item === 'object')
      .map((item: Record<string, any>, index) => {
        const file = String(item.file || '').trim()
        const typeRaw = String(item.type || 'image').toLowerCase()
        return {
          file,
          fileGen: String(item.file_gen || item.fileGen || '').trim() || this.extractGenFromValue(file) || '',
          type: typeRaw === 'video' ? 'video' : 'image',
          priority: Number(item.priority ?? item.obj_priority ?? index) || index,
        }
      })
      .filter((item) => item.file !== '')
      .map((item, index) => ({ ...item, priority: index }))
  }

  private extractCollections(payload: Record<string, any>) {
    const childCollectionRows = this.pickCollectionsByConfig(payload, '__child_', CHILD_COLLECTIONS, (raw) =>
      this.normalizeChildRows(raw),
    )
    const galleryCollectionRows = this.pickCollectionsByConfig(payload, '__gallery_', GALLERY_COLLECTIONS, (raw) =>
      this.normalizeGalleryRows(raw),
    )

    const sanitizedRest = { ...payload }
    for (const key of Object.keys(sanitizedRest)) {
      if (key.startsWith('__child_') || key.startsWith('__gallery_')) delete sanitizedRest[key]
    }

    for (const config of CHILD_COLLECTIONS) {
      for (const alias of config.aliases) {
        delete sanitizedRest[alias]
      }
    }
    for (const config of GALLERY_COLLECTIONS) {
      for (const alias of config.aliases) {
        delete sanitizedRest[alias]
      }
    }

    return {
      sanitizedRest,
      childCollectionRows,
      galleryCollectionRows,
    }
  }

  private toFlagsArray(flagsJson?: string | null): string[] {
    if (!flagsJson) return []
    try {
      const parsed = JSON.parse(flagsJson)
      return Array.isArray(parsed) ? parsed.map((item) => String(item)) : []
    } catch {
      return []
    }
  }

  private toStringArray(value: unknown): string[] {
    if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
    const raw = String(value ?? '').trim()
    if (!raw) return []

    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean)
    } catch {
      // ignore JSON parse errors and fallback to comma-split
    }

    return raw.split(',').map((item) => item.trim()).filter(Boolean)
  }

  private parsePublishedAt(value: unknown): Date | null {
    return OMDatetime.parseUtcDate(value as Date | string | number | null | undefined)
  }

  private shouldPublish(publishFlag: unknown, objState?: string): boolean {
    if (typeof publishFlag === 'boolean') return publishFlag
    const normalized = String(objState || '').trim().toLowerCase()
    return normalized === 'publish' || normalized === 'published'
  }

  private async nextDemoId(): Promise<string> {
    return OMUtilts.generateTimestampId()
  }

  private async nextRevision(contentId: string): Promise<number> {
    const result = await this.draftRepository
      .createQueryBuilder('d')
      .select('MAX(d.objRev)', 'max')
      .where('d.objContentId = :contentId', { contentId })
      .getRawOne<{ max: string }>()
    return (Number(result?.max) || 0) + 1
  }

  private async resolveUserDisplayName(userId?: number | null): Promise<string> {
    const id = Number(userId)
    if (!Number.isInteger(id) || id <= 0) return '-'

    const row = await this.draftRepository.manager
      .createQueryBuilder()
      .select('u.firstname', 'firstname')
      .addSelect('u.lastname', 'lastname')
      .addSelect('u.name', 'name')
      .from('wcm_users', 'u')
      .where('u.id = :id', { id })
      .getRawOne<{ firstname?: string; lastname?: string; name?: string }>()

    const first = String(row?.firstname || '').trim()
    const last = String(row?.lastname || '').trim()
    if (first || last) return `${first} ${last}`.trim()

    const fallback = String(row?.name || '').trim()
    return fallback || '-'
  }

  private getDefaultChildCollectionRows(childCollectionRows?: ChildCollectionRows): ChildRow[] {
    if (!childCollectionRows) return []
    const rows = Object.values(childCollectionRows).flat()
    return rows.map((row, index) => ({ ...row, title: row.title || `Child ${index + 1}` }))
  }

  private getDraftGalleryRepositoryByCollectionKey(collectionKey: string): Repository<DemoJpGalleryDraft | KoreaGalleryDraft> | null {
    if (collectionKey === GALLERY_FIELD_KEY) return this.galleryDraftRepository
    if (collectionKey === KOREA_GALLERY_FIELD_KEY) return this.koreaGalleryDraftRepository
    return null
  }

  private getPublishedGalleryRepositoryByCollectionKey(collectionKey: string): Repository<DemoJpGallery | KoreaGallery> | null {
    if (collectionKey === GALLERY_FIELD_KEY) return this.galleryRepository
    if (collectionKey === KOREA_GALLERY_FIELD_KEY) return this.koreaGalleryRepository
    return null
  }

  private async replaceDraftChildren(
    parentId: string,
    childCollectionRows: ChildCollectionRows,
    galleryCollectionRows: GalleryCollectionRows,
    draft: DemoJpDraft,
  ) {
    await this.childDraftRepository.delete({ objParentId: parentId, objRev: draft.objRev })
    await Promise.all(
      GALLERY_COLLECTIONS.map(async ({ key }) => {
        const repository = this.getDraftGalleryRepositoryByCollectionKey(key)
        if (!repository) return
        await repository.delete({ objParentId: parentId, objRev: draft.objRev } as any)
      }),
    )

    const childRows = this.getDefaultChildCollectionRows(childCollectionRows)
    if (childRows.length > 0) {
      const entities = childRows.map((row) => {
        return this.childDraftRepository.create({
          demoJpChildId: OMUtilts.generateTimestampId(),
          title: row.title,
          file: row.file,
          fileGen: row.fileGen,
          detail: row.detail || null,
          objParentId: parentId,
          objStatus: draft.objStatus,
          objState: draft.objState,
          objLang: draft.objLang,
          objRev: draft.objRev,
          objContentId: draft.objContentId,
          objCreatedBy: draft.objCreatedBy,
          objModifiedBy: draft.objModifiedBy,
          objPublishedDate: draft.objPublishedDate,
          objPublishedBy: draft.objPublishedBy,
        })
      })
      await this.childDraftRepository.save(entities)
    }

    for (const { key } of GALLERY_COLLECTIONS) {
      const repository = this.getDraftGalleryRepositoryByCollectionKey(key)
      if (!repository) continue

      const rows = galleryCollectionRows[key] || []
      if (rows.length === 0) continue

      const entities = rows.map((row, index) => {
        const idField = key === KOREA_GALLERY_FIELD_KEY ? 'koreaGalleryId' : 'demoJpGalleryId'
        return repository.create({
          [idField]: OMUtilts.generateTimestampId(),
          objParentId: parentId,
          objFile: row.file,
          objFileGen: row.fileGen,
          objPriority: Number.isFinite(row.priority) ? row.priority : index,
          objLang: draft.objLang,
          objRev: draft.objRev,
          objCreatedBy: draft.objCreatedBy,
        } as any)
      })
      await repository.save(entities as any)
    }
  }

  private async replacePublishedChildren(
    parentId: string,
    childCollectionRows: ChildCollectionRows,
    galleryCollectionRows: GalleryCollectionRows,
    draft: DemoJpDraft,
  ) {
    await this.childRepository.delete({ objParentId: parentId })
    await Promise.all(
      GALLERY_COLLECTIONS.map(async ({ key }) => {
        const repository = this.getPublishedGalleryRepositoryByCollectionKey(key)
        if (!repository) return
        await repository.delete({ objParentId: parentId } as any)
      }),
    )

    const childRows = this.getDefaultChildCollectionRows(childCollectionRows)
    if (childRows.length > 0) {
      const entities = childRows.map((row) => {
        return this.childRepository.create({
          demoJpChildId: OMUtilts.generateTimestampId(),
          title: row.title,
          file: row.file,
          fileGen: row.fileGen,
          detail: row.detail || null,
          objParentId: parentId,
          objLang: draft.objLang,
          objContentId: draft.objContentId,
          objCreatedBy: draft.objCreatedBy,
          objPublishedDate: draft.objPublishedDate,
          objPublishedBy: draft.objPublishedBy,
        })
      })
      await this.childRepository.save(entities)
    }

    for (const { key } of GALLERY_COLLECTIONS) {
      const repository = this.getPublishedGalleryRepositoryByCollectionKey(key)
      if (!repository) continue

      const rows = galleryCollectionRows[key] || []
      if (rows.length === 0) continue

      const entities = rows.map((row, index) => {
        const idField = key === KOREA_GALLERY_FIELD_KEY ? 'koreaGalleryId' : 'demoJpGalleryId'
        return repository.create({
          [idField]: OMUtilts.generateTimestampId(),
          objParentId: parentId,
          objFile: row.file,
          objFileGen: row.fileGen,
          objPriority: Number.isFinite(row.priority) ? row.priority : index,
          objLang: draft.objLang,
          objCreatedBy: draft.objCreatedBy,
        } as any)
      })
      await repository.save(entities as any)
    }
  }

  private async getMaxRevision(): Promise<number> {
    try {
      const raw = await fs.readFile(this.siteSettingsPath, 'utf-8')
      const parsed = JSON.parse(raw || '{}') as { maxRevision?: number }
      const value = Number(parsed.maxRevision)
      if (Number.isInteger(value) && value > 0) return value
    } catch {
      // fallback default
    }
    return 10
  }

  private async archiveCurrentRevision(existing: DemoJpDraft, actorId?: number): Promise<void> {
    await this.draftRepository.update(
      {
        demoJpId: existing.demoJpId,
        objLang: existing.objLang,
        objRev: existing.objRev,
      },
      {
        objStatus: 'archive',
        objModifiedBy: actorId ?? existing.objModifiedBy ?? existing.objCreatedBy,
        objModifiedDate: OMDatetime.getUtcNow(),
      },
    )
  }

  private async trimRevisionWindow(contentId: string): Promise<void> {
    const maxRevision = await this.getMaxRevision()
    const rows = await this.draftRepository.find({
      where: { objContentId: contentId },
      order: { objRev: 'DESC', objModifiedDate: 'DESC' },
    })

    if (rows.length <= maxRevision) return

    const overflow = rows.slice(maxRevision)
    if (overflow.length === 0) return

    for (const row of overflow) {
      await this.childDraftRepository.delete({ objParentId: row.demoJpId, objRev: row.objRev })
      await this.galleryDraftRepository.delete({ objParentId: row.demoJpId, objRev: row.objRev })
      await this.koreaGalleryDraftRepository.delete({ objParentId: row.demoJpId, objRev: row.objRev })
      await this.draftRepository.delete({
        demoJpId: row.demoJpId,
        objLang: row.objLang,
        objRev: row.objRev,
      })
    }
  }

  private async findDraftByAnyId(id: string): Promise<DemoJpDraft | null> {
    const contentId = String(id)
    const canSearchByContentId = /^\d+$/.test(contentId)

    return this.draftRepository
      .createQueryBuilder('d')
      .where('d.objStatus = :status', { status: 'active' })
      .andWhere(canSearchByContentId ? '(d.demoJpId = :id OR d.objContentId = :contentId)' : 'd.demoJpId = :id', {
        id,
        contentId,
      })
      .orderBy('d.objRev', 'DESC')
      .getOne()
  }

  private async getDraftChildRows(parentId: string, objRev: number): Promise<ChildRow[]> {
    const rows = await this.childDraftRepository.find({ where: { objParentId: parentId, objRev }, order: { demoJpChildId: 'ASC' } })
    return rows.map((item) => ({ title: item.title, file: item.file || null, fileGen: item.fileGen || null, detail: item.detail || '' }))
  }

  private async getDraftGalleryCollectionRows(parentId: string, objRev: number): Promise<GalleryCollectionRows> {
    const result: GalleryCollectionRows = {}

    const demoRows = await this.galleryDraftRepository.find({
      where: { objParentId: parentId, objRev },
      order: { objPriority: 'ASC', demoJpGalleryId: 'ASC' },
    })
    result[GALLERY_FIELD_KEY] = demoRows.map((item, index) => ({
      file: item.objFile,
      fileGen: item.objFileGen || '',
      type: 'image',
      priority: Number.isFinite(item.objPriority) ? item.objPriority : index,
    }))

    const koreaRows = await this.koreaGalleryDraftRepository.find({
      where: { objParentId: parentId, objRev },
      order: { objPriority: 'ASC', koreaGalleryId: 'ASC' },
    })
    result[KOREA_GALLERY_FIELD_KEY] = koreaRows.map((item, index) => ({
      file: item.objFile,
      fileGen: item.objFileGen || '',
      type: 'image',
      priority: Number.isFinite(item.objPriority) ? item.objPriority : index,
    }))

    return result
  }

  private hydrateDraft(
    draft: DemoJpDraft,
    childRows: ChildRow[],
    galleryCollectionRows: GalleryCollectionRows,
  ): DemoJpDraft & Record<string, any> {
    const childPayload = childRows.map((row) => ({ title: row.title, file: row.file || '', file_gen: row.fileGen || '', detail: row.detail }))
    const tagsArray = this.toStringArray((draft as any).homeBannerTags)
    const tagsValue = tagsArray.join(',')
    const switchValue = Number((draft as any).isActive) === 1 ? 'true' : 'false'

    const galleryPayloadByCollection: Record<string, Array<{ file: string; file_gen: string; type: string }>> = {}
    for (const config of GALLERY_COLLECTIONS) {
      const payload = (galleryCollectionRows[config.key] || []).map((row) => ({ file: row.file, file_gen: row.fileGen, type: row.type }))
      galleryPayloadByCollection[config.key] = payload
      for (const alias of config.aliases) {
        galleryPayloadByCollection[alias] = payload
      }
    }

    const hydrated: Record<string, any> = {
      ...draft,
      flags: this.toFlagsArray(draft.flagsJson),
      content: draft.contentHtml,
      is_active: Number((draft as any).isActive) === 1 ? 1 : 0,
      home_banner_tags: tagsValue,
      [CHILD_FIELD_KEY]: childPayload,
      child_list: childPayload,
      demo_jp_child_list: childPayload,
      ...galleryPayloadByCollection,
    }

    return hydrated as DemoJpDraft & Record<string, any>
  }

  private formatMasterDateFields<T extends Record<string, any>>(row: T): T {
    const created = OMDatetime.formatUtcDate(row.objCreatedDate ?? row.obj_created_date)
    const modified = OMDatetime.formatUtcDate(row.objModifiedDate ?? row.obj_modified_date)
    const published = OMDatetime.formatUtcDate(row.objPublishedDate ?? row.obj_published_date)

    const {
      demoJpId,
      objContentId,
      objCreatedDate,
      objModifiedDate,
      objPublishedDate,
      ...rest
    } = row as Record<string, any>

    return {
      ...rest,
      demo_jp_id: String(demoJpId ?? row.demo_jp_id ?? ''),
      obj_content_id: String(objContentId ?? row.obj_content_id ?? ''),
      obj_created_date: created || null,
      obj_modified_date: modified || null,
      obj_published_date: published || null,
    } as unknown as T
  }

  async create(createDto: CreateDemoJpDto): Promise<DemoJpDraft> {
    const {
      publish,
      obj_status,
      obj_state,
      obj_lang,
      obj_rev,
      obj_content_id,
      obj_published_by,
      obj_modified_by,
      obj_created_by,
      demo_jp_id,
      ...rest
    } = createDto

    const { sanitizedRest, childCollectionRows, galleryCollectionRows } = this.extractCollections(rest as Record<string, any>)
    const normalizedRest = this.normalizeMainInput(sanitizedRest, 'create')

    if (demo_jp_id) {
      this.logger.warn(`[create] Ignoring client demo_jp_id=${demo_jp_id}; server will generate id.`)
    }
    if (obj_content_id) {
      this.logger.warn(`[create] Ignoring client obj_content_id=${obj_content_id}; obj_content_id will match demo_jp_id.`)
    }
    const newId = await this.nextDemoId()
    const contentId = newId
    const nextRev = obj_rev ?? (await this.nextRevision(contentId))
    const publishFlag = this.shouldPublish(publish, obj_state)
    const nowUtc = OMDatetime.getUtcNow()

    const draft = this.draftRepository.create({
      demoJpId: newId,
      ...normalizedRest,
      objStatus: obj_status || 'active',
      objState: publishFlag ? 'published' : obj_state || 'draft',
      objLang: obj_lang || 'en',
      objRev: nextRev,
      objContentId: contentId,
      objCreatedDate: nowUtc,
      objCreatedBy: obj_created_by,
      objModifiedDate: nowUtc,
      objModifiedBy: obj_modified_by ?? obj_created_by,
      objPublishedDate: publishFlag ? nowUtc : null,
      objPublishedBy: publishFlag ? obj_published_by ?? obj_created_by ?? null : null,
    })

    const savedDraft = await this.draftRepository.save(draft)

    const resolvedChildCollectionRows = childCollectionRows || {}
    const resolvedGalleryCollectionRows = galleryCollectionRows || {}
    await this.replaceDraftChildren(savedDraft.demoJpId, resolvedChildCollectionRows, resolvedGalleryCollectionRows, savedDraft)

    if (publishFlag) {
      const published = this.demoRepository.create({
        ...savedDraft,
        publishedAt: this.parsePublishedAt(savedDraft.publishedAt),
      })
      await this.demoRepository.save(published)
      await this.replacePublishedChildren(savedDraft.demoJpId, resolvedChildCollectionRows, resolvedGalleryCollectionRows, savedDraft)
    }

    const hydrated = this.hydrateDraft(
      savedDraft,
      this.getDefaultChildCollectionRows(resolvedChildCollectionRows),
      resolvedGalleryCollectionRows,
    )
    const childCount = this.getDefaultChildCollectionRows(resolvedChildCollectionRows).length
    const galleryCount = Object.values(resolvedGalleryCollectionRows).reduce((total, rows) => total + rows.length, 0)
    this.logger.log(`[create] id=${savedDraft.demoJpId} child=${childCount} gallery=${galleryCount}`)
    return this.formatMasterDateFields(hydrated) as DemoJpDraft
  }

  async findAll(query?: ListQueryInput): Promise<DemoJpDraft[] | { items: DemoJpDraft[]; total: number; page: number; pageSize: number }> {
    if (!this.shouldUseServerList(query)) {
      const items = await this.draftRepository.find({ where: { objStatus: 'active' }, order: { objModifiedDate: 'DESC' } })
      return items.map((item) => this.formatMasterDateFields(item as unknown as Record<string, any>)) as DemoJpDraft[]
    }

    const { qb, normalized } = this.buildListQuery(query)
    qb.skip((normalized.page - 1) * normalized.pageSize)
    qb.take(normalized.pageSize)

    const [items, total] = await qb.getManyAndCount()

    return {
      items: items.map((item) => this.formatMasterDateFields(item as unknown as Record<string, any>)) as DemoJpDraft[],
      total,
      page: normalized.page,
      pageSize: normalized.pageSize,
    }
  }

  async exportRows(payload?: ListQueryInput & { fields?: string[] }): Promise<{ fields: string[]; total: number; items: Record<string, any>[] }> {
    const requestedFields = Array.isArray(payload?.fields)
      ? payload?.fields.map((field) => String(field || '').trim()).filter(Boolean)
      : []

    const selectedPairs = requestedFields
      .map((field) => ({ field, column: this.resolveColumn(field) }))
      .filter((item): item is { field: string; column: keyof DemoJpDraft } => Boolean(item.column))

    const fallbackFields = ['demo_jp_id', 'title', 'email', 'category', 'obj_state', 'obj_lang', 'obj_modified_date']
    const pairs = selectedPairs.length > 0
      ? selectedPairs
      : fallbackFields
          .map((field) => ({ field, column: this.resolveColumn(field) }))
          .filter((item): item is { field: string; column: keyof DemoJpDraft } => Boolean(item.column))

    const { qb } = this.buildListQuery(payload)
    const rows = await qb.getMany()

    const items = rows.map((row) => {
      const output: Record<string, any> = {}
      pairs.forEach(({ field, column }) => {
        output[field] = (row as any)[column]
      })
      return output
    })

    return {
      fields: pairs.map((item) => item.field),
      total: items.length,
      items,
    }
  }

  async findOne(id: string): Promise<DemoJpDraft | null> {
    const draft = await this.findDraftByAnyId(id)
    if (!draft) return null
    const [childRows, galleryCollectionRows] = await Promise.all([
      this.getDraftChildRows(draft.demoJpId, draft.objRev),
      this.getDraftGalleryCollectionRows(draft.demoJpId, draft.objRev),
    ])
    const hydrated = this.hydrateDraft(draft, childRows, galleryCollectionRows)
    const modifierName = await this.resolveUserDisplayName(draft.objModifiedBy)
    return this.formatMasterDateFields({
      ...hydrated,
      obj_modified_by_name: modifierName,
    }) as DemoJpDraft
  }

  async getRevisions(id: string): Promise<{ activeRevision: number | null; items: Array<Record<string, any>> }> {
    const normalizedId = String(id)
    const canUseContentId = /^\d+$/.test(normalizedId)

    const latest = await this.draftRepository
      .createQueryBuilder('d')
      .where(canUseContentId ? '(d.demoJpId = :id OR d.objContentId = :contentId)' : 'd.demoJpId = :id', {
        id: normalizedId,
        contentId: normalizedId,
      })
      .orderBy('d.objRev', 'DESC')
      .getOne()

    if (!latest) return { activeRevision: null, items: [] }

    const rows = await this.draftRepository.find({
      where: { objContentId: String(latest.objContentId) },
      order: { objRev: 'DESC', objModifiedDate: 'DESC' },
    })

    const userIds = Array.from(
      new Set(
        rows
          .map((row) => Number(row.objModifiedBy))
          .filter((value) => Number.isInteger(value) && value > 0),
      ),
    )

    const displayNameMap = new Map<number, string>()
    await Promise.all(
      userIds.map(async (userId) => {
        displayNameMap.set(userId, await this.resolveUserDisplayName(userId))
      }),
    )

    const activeRow = rows.find((row) => row.objStatus === 'active') || null

    return {
      activeRevision: activeRow?.objRev ?? null,
      items: rows.map((row) => ({
        demo_jp_id: row.demoJpId,
        obj_content_id: row.objContentId,
        obj_lang: row.objLang,
        obj_rev: row.objRev,
        obj_status: row.objStatus,
        obj_state: row.objState,
        obj_modified_by: row.objModifiedBy,
        obj_modified_by_name: displayNameMap.get(Number(row.objModifiedBy)) || '-',
        obj_modified_date: row.objModifiedDate,
        is_active: row.objStatus === 'active',
      })),
    }
  }

  async getRevisionSnapshot(id: string, rev: number, lang?: string): Promise<DemoJpDraft | null> {
    const normalizedId = String(id)
    const canUseContentId = /^\d+$/.test(normalizedId)

    const latest = await this.draftRepository
      .createQueryBuilder('d')
      .where(canUseContentId ? '(d.demoJpId = :id OR d.objContentId = :contentId)' : 'd.demoJpId = :id', {
        id: normalizedId,
        contentId: normalizedId,
      })
      .orderBy('d.objRev', 'DESC')
      .getOne()

    if (!latest) return null

    const targetLang = String(lang || '').trim()
    const qb = this.draftRepository
      .createQueryBuilder('d')
      .where('d.objContentId = :contentId', { contentId: String(latest.objContentId) })
      .andWhere('d.objRev = :rev', { rev })

    if (targetLang) {
      qb.andWhere('d.objLang = :lang', { lang: targetLang })
    }

    const row = await qb.orderBy('d.objModifiedDate', 'DESC').getOne()
    if (!row) return null

    const [childRows, galleryCollectionRows] = await Promise.all([
      this.getDraftChildRows(row.demoJpId, row.objRev),
      this.getDraftGalleryCollectionRows(row.demoJpId, row.objRev),
    ])
    const hydrated = this.hydrateDraft(row, childRows, galleryCollectionRows)
    const modifierName = await this.resolveUserDisplayName(row.objModifiedBy)

    return this.formatMasterDateFields({
      ...hydrated,
      obj_modified_by_name: modifierName,
    }) as DemoJpDraft
  }

  async update(id: string, updateDto: UpdateDemoJpDto): Promise<DemoJpDraft | null> {
    const existing = await this.findDraftByAnyId(id)
    if (!existing) return null

    const {
      publish,
      obj_status,
      obj_state,
      obj_lang,
      obj_published_by,
      obj_modified_by,
      obj_content_id,
      ...rest
    } = updateDto

    const { sanitizedRest, childCollectionRows, galleryCollectionRows } = this.extractCollections(rest as Record<string, any>)
    const normalizedRest = this.normalizeMainInput(sanitizedRest, 'update')

    if (obj_content_id && String(obj_content_id) !== String(existing.objContentId)) {
      this.logger.warn(`[update] Ignoring client obj_content_id=${obj_content_id}; keeping existing obj_content_id=${existing.objContentId}.`)
    }

    await this.archiveCurrentRevision(existing, obj_modified_by)

    const contentId = String(existing.objContentId)
    const nextRev = await this.nextRevision(contentId)
    const publishFlag = this.shouldPublish(publish, obj_state)
    const nowUtc = OMDatetime.getUtcNow()
    const nextObjState = publishFlag ? 'published' : obj_state || existing.objState || 'draft'
    const nextPublishedDate = nextObjState === 'published'
      ? (existing.objPublishedDate || nowUtc)
      : null

    const merged = this.draftRepository.create({
      ...existing,
      ...normalizedRest,
      objStatus: 'active',
      objState: nextObjState,
      objLang: obj_lang || existing.objLang || 'en',
      objRev: nextRev,
      objContentId: contentId,
      objModifiedDate: nowUtc,
      objModifiedBy: obj_modified_by ?? existing.objModifiedBy ?? existing.objCreatedBy,
      objPublishedDate: nextPublishedDate,
      objPublishedBy: publishFlag ? obj_published_by ?? existing.objPublishedBy ?? existing.objCreatedBy : null,
      publishedAt: this.parsePublishedAt(normalizedRest.publishedAt ?? existing.publishedAt),
    })

    const savedDraft = await this.draftRepository.save(merged)

    const resolvedChildCollectionRows: ChildCollectionRows = childCollectionRows
      ? childCollectionRows
      : { [CHILD_FIELD_KEY]: await this.getDraftChildRows(existing.demoJpId, existing.objRev) }
    const resolvedGalleryCollectionRows = galleryCollectionRows
      ? galleryCollectionRows
      : await this.getDraftGalleryCollectionRows(existing.demoJpId, existing.objRev)

    await this.replaceDraftChildren(savedDraft.demoJpId, resolvedChildCollectionRows, resolvedGalleryCollectionRows, savedDraft)

    if (publishFlag) {
      const published = this.demoRepository.create({
        ...savedDraft,
        publishedAt: this.parsePublishedAt(savedDraft.publishedAt),
      })
      await this.demoRepository.save(published)
      await this.replacePublishedChildren(savedDraft.demoJpId, resolvedChildCollectionRows, resolvedGalleryCollectionRows, savedDraft)
    } else {
      await this.childRepository.delete({ objParentId: savedDraft.demoJpId })
      await this.galleryRepository.delete({ objParentId: savedDraft.demoJpId })
      await this.koreaGalleryRepository.delete({ objParentId: savedDraft.demoJpId })
      await this.demoRepository.delete({ demoJpId: savedDraft.demoJpId })
    }

    await this.trimRevisionWindow(contentId)

    const hydrated = this.hydrateDraft(
      savedDraft,
      this.getDefaultChildCollectionRows(resolvedChildCollectionRows),
      resolvedGalleryCollectionRows,
    )
    const childCount = this.getDefaultChildCollectionRows(resolvedChildCollectionRows).length
    const galleryCount = Object.values(resolvedGalleryCollectionRows).reduce((total, rows) => total + rows.length, 0)
    this.logger.log(`[update] id=${id} child=${childCount} gallery=${galleryCount}`)
    return this.formatMasterDateFields(hydrated) as DemoJpDraft
  }

  async remove(id: string, actorId?: number): Promise<void> {
    const existing = await this.findDraftByAnyId(id)
    if (!existing) return

    await this.archiveCurrentRevision(existing, actorId)

    const nextRev = await this.nextRevision(String(existing.objContentId))
    const deleterId = actorId ?? existing.objModifiedBy ?? existing.objCreatedBy

    await this.draftRepository.save(
      this.draftRepository.create({
        ...existing,
        objStatus: 'delete',
        objState: 'draft',
        objRev: nextRev,
        objModifiedDate: OMDatetime.getUtcNow(),
        objModifiedBy: deleterId,
        objPublishedDate: null,
        objPublishedBy: null,
      }),
    )

    await this.childRepository.delete({ objParentId: existing.demoJpId })
    await this.galleryRepository.delete({ objParentId: existing.demoJpId })
    await this.koreaGalleryRepository.delete({ objParentId: existing.demoJpId })
    await this.demoRepository.delete({ demoJpId: existing.demoJpId })

    await this.trimRevisionWindow(String(existing.objContentId))
    this.logger.log(`[delete] id=${existing.demoJpId} by=${deleterId}`)
  }

  async runListAction(payload?: ListActionInput, actorId?: number): Promise<{ action: string; requested: number; success: number; failed: number; failedIds: string[] }> {
    const action = String(payload?.action || '').trim().toLowerCase()
    const ids = Array.isArray(payload?.ids)
      ? payload!.ids.map((id) => String(id ?? '').trim()).filter(Boolean)
      : []

    if (!action || ids.length === 0) {
      return { action, requested: ids.length, success: 0, failed: ids.length, failedIds: ids }
    }

    let success = 0
    const failedIds: string[] = []

    if (action === 'setstatus') {
      const allowedStates = new Set(['published', 'unpublish', 'draft'])
      const nextState = String(payload?.state || '').trim().toLowerCase()
      if (!allowedStates.has(nextState)) {
        return { action, requested: ids.length, success: 0, failed: ids.length, failedIds: ids }
      }

      for (const id of ids) {
        try {
          const publish = nextState === 'published'
          const result = await this.update(id, {
            obj_state: nextState,
            publish,
            obj_modified_by: actorId,
            obj_published_by: publish ? actorId : undefined,
          } as UpdateDemoJpDto)

          if (!result) {
            failedIds.push(id)
            continue
          }
          success += 1
        } catch {
          failedIds.push(id)
        }
      }

      return {
        action,
        requested: ids.length,
        success,
        failed: failedIds.length,
        failedIds,
      }
    }

    if (action === 'delete') {
      for (const id of ids) {
        try {
          await this.remove(id, actorId)
          success += 1
        } catch {
          failedIds.push(id)
        }
      }

      return {
        action,
        requested: ids.length,
        success,
        failed: failedIds.length,
        failedIds,
      }
    }

    return { action, requested: ids.length, success: 0, failed: ids.length, failedIds: ids }
  }

  async getLookup(field?: string, lang?: string): Promise<LookupResponse> {
    const normalizedField = String(field || '')
    const normalizedLang = this.resolveLang(lang)

    const map: Record<string, Array<{ value: string; label: string }>> = {
      category: [
        { value: 'news', label: 'News' },
        { value: 'blog', label: 'Blog' },
        { value: 'tutorial', label: 'Tutorial' },
      ],
      status: [
        { value: 'draft', label: 'Draft' },
        { value: 'published', label: 'Published' },
        { value: 'archived', label: 'Archived' },
      ],
      flags: [
        { value: 'featured', label: 'Featured' },
        { value: 'pinned', label: 'Pinned' },
        { value: 'sponsored', label: 'Sponsored' },
      ],
    }

    if (this.tableLookupMap[normalizedField]) {
      const options = await this.queryTableLookup(this.tableLookupMap[normalizedField], normalizedLang)
      return {
        field: normalizedField,
        lang: normalizedLang,
        options,
      }
    }

    return {
      field: normalizedField,
      lang: normalizedLang,
      options: map[normalizedField] || [],
    }
  }
}
