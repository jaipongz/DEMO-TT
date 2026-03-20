import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { promises as fs } from 'fs'
import * as path from 'path'
import { HomeBanner } from './home_banner.entity'
import { HomeBannerDraft } from './home_banner-draft.entity'
import { HomeBannerDetail } from './home_banner-detail.entity'
import { HomeBannerDetailDraft } from './home_banner-detail-draft.entity'
import { HomeBannerGallery } from './home_banner-gallery.entity'
import { HomeBannerGalleryDraft } from './home_banner-gallery-draft.entity'
import { CreateHomeBannerDto } from './dto/create-home_banner.dto'
import { UpdateHomeBannerDto } from './dto/update-home_banner.dto'
import { OMUtilts } from '../../common/utils/OMUtilts.util'

const HOME_BANNER_DETAIL_FIELD_KEY = '__child_home_banner_detail_0_0'
const HOME_BANNER_GALLERY_FIELD_KEY = '__gallery_home_banner_gallery'

const HOME_BANNER_DETAIL_ALIASES = [
  HOME_BANNER_DETAIL_FIELD_KEY,
  'child_file',
  'childFiles',
  'home_banner_detail',
  'homeBannerDetail',
  'homeBannerDetails',
]

const HOME_BANNER_GALLERY_ALIASES = [
  HOME_BANNER_GALLERY_FIELD_KEY,
  'gallery',
  'gallery_file',
  'galleryFiles',
  'home_banner_gallery',
  'homeBannerGallery',
  'homeBannerGalleries',
]

const HOME_BANNER_DETAIL_PRIMARY_KEYS = [
  HOME_BANNER_DETAIL_FIELD_KEY,
  'child_file',
]

const HOME_BANNER_GALLERY_PRIMARY_KEYS = [
  HOME_BANNER_GALLERY_FIELD_KEY,
  'gallery',
  'home_banner_gallery',
]

type HomeBannerDetailRow = {
  title: string
  file: string | null
  fileGen: string | null
  detail: string
}

type HomeBannerGalleryRow = {
  file: string
  fileGen: string
  priority: number
}

type LookupOption = {
  value: string
  label: string
}

type DynamicCollections = {
  sanitizedRest: Record<string, any>
  childRows?: HomeBannerDetailRow[]
  galleryRows?: HomeBannerGalleryRow[]
  childSource?: string
  gallerySource?: string
}

type PublishStateInput = string | undefined

@Injectable()
export class HomeBannerService {
  private readonly logger = new Logger(HomeBannerService.name)
  private readonly siteSettingsPath = path.join(process.cwd(), 'config', 'site-settings.json')

  constructor(
    @InjectRepository(HomeBanner)
    private homeBannerRepository: Repository<HomeBanner>,
    @InjectRepository(HomeBannerDraft)
    private draftRepository: Repository<HomeBannerDraft>,
    @InjectRepository(HomeBannerDetail)
    private detailRepository: Repository<HomeBannerDetail>,
    @InjectRepository(HomeBannerDetailDraft)
    private detailDraftRepository: Repository<HomeBannerDetailDraft>,
    @InjectRepository(HomeBannerGallery)
    private galleryRepository: Repository<HomeBannerGallery>,
    @InjectRepository(HomeBannerGalleryDraft)
    private galleryDraftRepository: Repository<HomeBannerGalleryDraft>,
  ) {}

  private extractGenFromValue(value: unknown): string | null {
    const raw = String(value || '').trim()
    if (!raw) return null

    const fromUrl = raw.match(/\/stock\/[^/]+\/([a-zA-Z0-9]{8,32})\//)
    if (fromUrl?.[1]) return fromUrl[1]

    const fromStoredName = raw.match(/^([a-zA-Z0-9]{8,32})__/)
    if (fromStoredName?.[1]) return fromStoredName[1]

    const fromLegacyName = raw.match(/^([a-zA-Z0-9]{8,32})-\d+/)
    if (fromLegacyName?.[1]) return fromLegacyName[1]

    return null
  }

  private normalizeInput(payload: Record<string, any>, mode: 'create' | 'update' = 'create') {
    const normalized = { ...payload }

    const isCreate = mode === 'create'

    const hasBanner = Object.prototype.hasOwnProperty.call(normalized, 'banner') || Object.prototype.hasOwnProperty.call(normalized, 'banner_gen') || Object.prototype.hasOwnProperty.call(normalized, 'bannerGen') || Object.prototype.hasOwnProperty.call(normalized, 'banner_alt') || Object.prototype.hasOwnProperty.call(normalized, 'bannerAlt')
    if (isCreate || hasBanner) {
      normalized.banner = normalized.banner ?? null
      normalized.bannerGen = normalized.bannerGen ?? normalized.banner_gen ?? this.extractGenFromValue(normalized.banner) ?? null
      normalized.bannerAlt = normalized.bannerAlt ?? normalized.banner_alt ?? (normalized.banner ? String(normalized.banner).replace(/\.[^/.]+$/, '') : null)
    }

    const hasBannerVideo = Object.prototype.hasOwnProperty.call(normalized, 'banner_video') || Object.prototype.hasOwnProperty.call(normalized, 'bannerVideo') || Object.prototype.hasOwnProperty.call(normalized, 'banner_video_gen') || Object.prototype.hasOwnProperty.call(normalized, 'bannerVideoGen')
    if (isCreate || hasBannerVideo) {
      normalized.bannerVideo = normalized.bannerVideo ?? normalized.banner_video ?? null
      normalized.bannerVideoGen =
        normalized.bannerVideoGen ??
        normalized.banner_video_gen ??
        this.extractGenFromValue(normalized.bannerVideo) ??
        null
    }

    delete normalized.banner_gen
    delete normalized.banner_alt
    delete normalized.banner_video
    delete normalized.banner_video_gen

    return normalized
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

  private asArrayValue(value: unknown): any[] | undefined {
    if (Array.isArray(value)) return value
    if (typeof value !== 'string') return undefined

    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : undefined
    } catch {
      return undefined
    }
  }

  private pickBestArrayByAliases(
    payload: Record<string, any>,
    aliases: string[],
    prefix: string,
    primaryKeys: string[] = [],
  ): { value: any[] | undefined; source?: string } {
    for (const key of primaryKeys) {
      if (!Object.prototype.hasOwnProperty.call(payload, key)) continue
      const parsed = this.asArrayValue(payload[key])
      if (parsed) return { value: parsed, source: key }
    }

    const candidates: Array<{ source: string; value: any[] }> = []

    for (const key of aliases) {
      const parsed = this.asArrayValue(payload[key])
      if (parsed) candidates.push({ source: key, value: parsed })
    }

    for (const [key, value] of Object.entries(payload)) {
      if (!key.startsWith(prefix)) continue
      const parsed = this.asArrayValue(value)
      if (parsed) candidates.push({ source: key, value: parsed })
    }

    if (candidates.length === 0) {
      return { value: undefined }
    }

    const nonEmpty = candidates.filter((candidate) => candidate.value.length > 0)
    const selected = (nonEmpty.length > 0 ? nonEmpty : candidates).sort((a, b) => b.value.length - a.value.length)[0]

    return { value: selected.value, source: selected.source }
  }

  private normalizeChildRows(raw: unknown): HomeBannerDetailRow[] {
    if (!Array.isArray(raw)) return []

    return raw
      .filter((item) => item && typeof item === 'object')
      .map((item: Record<string, any>, index) => {
        const titleRaw = String(item.title || '').trim()
        const fileRaw = String(item.file || item.filename || '').trim()
        const detailRaw = String(item.detail ?? item.description ?? '').trim()

        return {
          title: titleRaw || fileRaw || `Home Banner Detail ${index + 1}`,
          file: fileRaw || null,
          fileGen:
            String(item.file_gen || item.fileGen || '').trim() ||
            this.extractGenFromValue(fileRaw) ||
            null,
          detail: detailRaw,
        }
      })
      .filter((item) => item.title.trim() !== '' || item.file !== null || item.detail !== '')
  }

  private normalizeGalleryRows(raw: unknown): HomeBannerGalleryRow[] {
    if (!Array.isArray(raw)) return []

    return raw
      .filter((item) => item && typeof item === 'object')
      .map((item: Record<string, any>, index) => {
        const file = String(item.file || item.filename || item.obj_file || '').trim()
        const fileGen =
          String(item.file_gen || item.fileGen || item.obj_file_gen || '').trim() ||
          this.extractGenFromValue(file) ||
          ''
        return {
          file,
          fileGen,
          priority: Number(item.priority ?? item.obj_priority ?? index) || index,
        }
      })
      .filter((item) => item.file !== '')
      .map((item, index) => ({ ...item, priority: index }))
  }

  private extractDynamicCollections(payload: Record<string, any>): DynamicCollections {
    const childResolved = this.pickBestArrayByAliases(
      payload,
      HOME_BANNER_DETAIL_ALIASES,
      '__child_',
      HOME_BANNER_DETAIL_PRIMARY_KEYS,
    )
    const galleryResolved = this.pickBestArrayByAliases(
      payload,
      HOME_BANNER_GALLERY_ALIASES,
      '__gallery_',
      HOME_BANNER_GALLERY_PRIMARY_KEYS,
    )
    const sanitizedRest = { ...payload }

    for (const key of Object.keys(sanitizedRest)) {
      if (key.startsWith('__child_') || key.startsWith('__gallery_')) {
        delete sanitizedRest[key]
      }
    }

    for (const key of [...HOME_BANNER_DETAIL_ALIASES, ...HOME_BANNER_GALLERY_ALIASES]) {
      delete sanitizedRest[key]
    }

    return {
      sanitizedRest,
      childRows: childResolved.value === undefined ? undefined : this.normalizeChildRows(childResolved.value),
      galleryRows: galleryResolved.value === undefined ? undefined : this.normalizeGalleryRows(galleryResolved.value),
      childSource: childResolved.source,
      gallerySource: galleryResolved.source,
    }
  }

  private async replaceDraftChildren(
    parentId: string,
    childRows: HomeBannerDetailRow[],
    galleryRows: HomeBannerGalleryRow[],
    draft: HomeBannerDraft,
  ): Promise<void> {
    await this.detailDraftRepository.delete({ objParentId: parentId, objRev: draft.objRev })
    await this.galleryDraftRepository.delete({ objParentId: parentId, objRev: draft.objRev })

    if (childRows.length > 0) {
      const detailEntities = childRows.map((row) => {
        return this.detailDraftRepository.create({
          homeBannerDetailId: OMUtilts.generateTimestampId(),
          title: row.title,
          file: row.file,
          fileGen: row.fileGen,
          description: row.detail || null,
          descriptionPlain: this.stripHtmlToText(row.detail) || null,
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
      await this.detailDraftRepository.save(detailEntities)
    }

    if (galleryRows.length > 0) {
      const galleryEntities = galleryRows.map((row, index) => {
        return this.galleryDraftRepository.create({
          homeBannerGalleryId: OMUtilts.generateTimestampId(),
          objParentId: parentId,
          objFile: row.file,
          objFileGen: row.fileGen,
          objPriority: Number.isFinite(row.priority) ? row.priority : index,
          objLang: draft.objLang,
          objRev: draft.objRev,
          objCreatedBy: draft.objCreatedBy,
        })
      })
      await this.galleryDraftRepository.save(galleryEntities)
    }
  }

  private async replacePublishedChildren(
    parentId: string,
    childRows: HomeBannerDetailRow[],
    galleryRows: HomeBannerGalleryRow[],
    draft: HomeBannerDraft,
  ): Promise<void> {
    await this.detailRepository.delete({ objParentId: parentId })
    await this.galleryRepository.delete({ objParentId: parentId })

    if (childRows.length > 0) {
      const detailEntities = childRows.map((row) => {
        return this.detailRepository.create({
          homeBannerDetailId: OMUtilts.generateTimestampId(),
          title: row.title,
          file: row.file,
          fileGen: row.fileGen,
          description: row.detail || null,
          descriptionPlain: this.stripHtmlToText(row.detail) || null,
          objParentId: parentId,
          objLang: draft.objLang,
          objContentId: draft.objContentId,
          objCreatedBy: draft.objCreatedBy,
          objPublishedDate: draft.objPublishedDate,
          objPublishedBy: draft.objPublishedBy,
        })
      })
      await this.detailRepository.save(detailEntities)
    }

    if (galleryRows.length > 0) {
      const galleryEntities = galleryRows.map((row, index) => {
        return this.galleryRepository.create({
          homeBannerGalleryId: OMUtilts.generateTimestampId(),
          objParentId: parentId,
          objFile: row.file,
          objFileGen: row.fileGen,
          objPriority: Number.isFinite(row.priority) ? row.priority : index,
          objLang: draft.objLang,
          objCreatedBy: draft.objCreatedBy,
        })
      })
      await this.galleryRepository.save(galleryEntities)
    }
  }

  private async getDraftChildRows(parentId: string, objRev: number): Promise<HomeBannerDetailRow[]> {
    const rows = await this.detailDraftRepository.find({
      where: { objParentId: parentId, objRev },
      order: { homeBannerDetailId: 'ASC' },
    })

    return rows.map((item) => ({
      title: item.title,
      file: item.file || null,
      fileGen: item.fileGen || null,
      detail: item.description || '',
    }))
  }

  private async getDraftGalleryRows(parentId: string, objRev: number): Promise<HomeBannerGalleryRow[]> {
    const rows = await this.galleryDraftRepository.find({
      where: { objParentId: parentId, objRev },
      order: { objPriority: 'ASC', homeBannerGalleryId: 'ASC' },
    })

    return rows.map((item, index) => ({
      file: item.objFile,
      fileGen: item.objFileGen || '',
      priority: Number.isFinite(item.objPriority) ? item.objPriority : index,
    }))
  }

  private async withDynamicChildren<T extends HomeBannerDraft | null>(draft: T): Promise<T | (HomeBannerDraft & Record<string, any>) | null> {
    if (!draft) return null

    const [childRows, galleryRows] = await Promise.all([
      this.getDraftChildRows(draft.homeBannerId, draft.objRev),
      this.getDraftGalleryRows(draft.homeBannerId, draft.objRev),
    ])

    const detailPayload = childRows.map((row) => ({
      title: row.title,
      file: row.file || '',
      file_gen: row.fileGen || '',
      detail: row.detail,
    }))

    const galleryPayload = galleryRows.map((row) => ({
      file: row.file,
      file_gen: row.fileGen,
      type: 'image',
    }))

    const modifierName = await this.resolveUserDisplayName(draft.objModifiedBy)

    return {
      ...draft,
      [HOME_BANNER_DETAIL_FIELD_KEY]: detailPayload,
      child_file: detailPayload,
      home_banner_detail: detailPayload,
      [HOME_BANNER_GALLERY_FIELD_KEY]: galleryPayload,
      gallery: galleryPayload,
      home_banner_gallery: galleryPayload,
      obj_modified_by_name: modifierName,
      objModifiedByName: modifierName,
    }
  }

  private shouldPublish(publishFlag: unknown, objState?: PublishStateInput): boolean {
    if (typeof publishFlag === 'boolean') return publishFlag
    const normalized = String(objState || '').trim().toLowerCase()
    return normalized === 'publish' || normalized === 'published'
  }

  private async nextHomeBannerId(): Promise<string> {
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

  private async archiveCurrentRevision(existing: HomeBannerDraft, actorId?: number): Promise<void> {
    await this.draftRepository.update(
      {
        homeBannerId: existing.homeBannerId,
        objLang: existing.objLang,
        objRev: existing.objRev,
      },
      {
        objStatus: 'archive',
        objModifiedBy: actorId ?? existing.objModifiedBy ?? existing.objCreatedBy,
        objModifiedDate: new Date(),
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
      await this.detailDraftRepository.delete({ objParentId: row.homeBannerId, objRev: row.objRev })
      await this.galleryDraftRepository.delete({ objParentId: row.homeBannerId, objRev: row.objRev })
      await this.draftRepository.delete({
        homeBannerId: row.homeBannerId,
        objLang: row.objLang,
        objRev: row.objRev,
      })
    }
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

  private async findDraftByAnyId(id: string): Promise<HomeBannerDraft | null> {
    const contentId = String(id)
    const canSearchByContentId = /^\d+$/.test(contentId)

    return this.draftRepository
      .createQueryBuilder('d')
      .where('d.objStatus = :status', { status: 'active' })
      .andWhere(canSearchByContentId ? '(d.homeBannerId = :id OR d.objContentId = :contentId)' : 'd.homeBannerId = :id', {
        id,
        contentId,
      })
      .orderBy('d.objRev', 'DESC')
      .getOne()
  }

  async create(createDto: CreateHomeBannerDto): Promise<HomeBannerDraft> {
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
      homeBannerId,
      ...rest
    } = createDto

    const { sanitizedRest, childRows, galleryRows, childSource, gallerySource } = this.extractDynamicCollections(rest as Record<string, any>)
    this.logger.log(
      `[create] payloadKeys=${Object.keys(rest || {}).join(',') || '-'} childSource=${childSource || '-'} childCount=${childRows?.length ?? -1} gallerySource=${gallerySource || '-'} galleryCount=${galleryRows?.length ?? -1}`,
    )
    const normalizedRest = this.normalizeInput(sanitizedRest, 'create')

    if (homeBannerId) {
      this.logger.warn(`[create] Ignoring client homeBannerId=${homeBannerId}; server will generate id.`)
    }
    if (obj_content_id) {
      this.logger.warn(`[create] Ignoring client obj_content_id=${obj_content_id}; obj_content_id will match homeBannerId.`)
    }
    const newId = await this.nextHomeBannerId()
    const contentId = newId
    const nextRev = obj_rev ?? (await this.nextRevision(contentId))
    const publishFlag = this.shouldPublish(publish, obj_state)

    const draft = this.draftRepository.create({
      homeBannerId: newId,
      ...normalizedRest,
      objStatus: obj_status || 'active',
      objState: publishFlag ? 'published' : obj_state || 'draft',
      objLang: obj_lang || 'en',
      objRev: nextRev,
      objContentId: contentId,
      objCreatedBy: obj_created_by,
      objModifiedBy: obj_modified_by ?? obj_created_by,
      objPublishedDate: publishFlag ? new Date() : null,
      objPublishedBy: publishFlag ? obj_published_by ?? obj_created_by ?? null : null,
    })

    const savedDraft = await this.draftRepository.save(draft)

    const resolvedChildRows = childRows || []
    const resolvedGalleryRows = galleryRows || []

    await this.replaceDraftChildren(savedDraft.homeBannerId, resolvedChildRows, resolvedGalleryRows, savedDraft)
    this.logger.log(
      `[create] saved parentId=${savedDraft.homeBannerId} draftChild=${resolvedChildRows.length} draftGallery=${resolvedGalleryRows.length}`,
    )

    if (publishFlag) {
      const published = this.homeBannerRepository.create({
        homeBannerId: savedDraft.homeBannerId,
        title: savedDraft.title,
        banner: savedDraft.banner,
        bannerGen: savedDraft.bannerGen,
        bannerAlt: savedDraft.bannerAlt,
        bannerVideo: savedDraft.bannerVideo,
        bannerVideoGen: savedDraft.bannerVideoGen,
        mode: savedDraft.mode,
        objLang: savedDraft.objLang,
        objContentId: savedDraft.objContentId,
        objCreatedDate: savedDraft.objCreatedDate,
        objCreatedBy: savedDraft.objCreatedBy,
        objPublishedDate: savedDraft.objPublishedDate,
        objPublishedBy: savedDraft.objPublishedBy,
      })
      await this.homeBannerRepository.save(published)

      await this.replacePublishedChildren(savedDraft.homeBannerId, resolvedChildRows, resolvedGalleryRows, savedDraft)
    } else {
      await this.detailRepository.delete({ objParentId: savedDraft.homeBannerId })
      await this.galleryRepository.delete({ objParentId: savedDraft.homeBannerId })
      await this.homeBannerRepository.delete({ homeBannerId: savedDraft.homeBannerId })
    }

    return (await this.withDynamicChildren(savedDraft)) as HomeBannerDraft
  }

  async findAll(): Promise<HomeBannerDraft[]> {
    return this.draftRepository.find({
      where: { objStatus: 'active' },
      order: {
        objModifiedDate: 'DESC',
      },
    })
  }

  async getLookup(field?: string, lang?: string): Promise<{ field: string; lang: string; options: LookupOption[] }> {
    const normalizedField = String(field || '')
    const normalizedLang = String(lang || '').trim()

    if (normalizedField === 'mode') {
      return {
        field: normalizedField,
        lang: normalizedLang,
        options: [
          { value: 'image', label: 'Image' },
          { value: 'video', label: 'Video' },
          { value: 'mixed', label: 'Mixed' },
        ],
      }
    }

    if (normalizedField === 'dynamic_sample') {
      const query = this.draftRepository
        .createQueryBuilder('x')
        .select('x.objContentId', 'value')
        .addSelect('x.title', 'label')
        .where("x.title IS NOT NULL AND x.title <> ''")
        .distinct(true)
        .orderBy('x.title', 'ASC')
        .limit(200)

      if (normalizedLang !== '') {
        query.andWhere('x.objLang = :lang', { lang: normalizedLang })
      }

      const rows = await query.getRawMany<{ value: string | number; label: string }>()

      return {
        field: normalizedField,
        lang: normalizedLang,
        options: rows.map((row) => ({
          value: String(row.value),
          label: String(row.label || row.value),
        })),
      }
    }

    return { field: normalizedField, lang: normalizedLang, options: [] }
  }

  async findOne(id: string): Promise<HomeBannerDraft | null> {
    const draft = await this.findDraftByAnyId(id)
    return (await this.withDynamicChildren(draft)) as HomeBannerDraft | null
  }

  async getRevisions(id: string): Promise<{ activeRevision: number | null; items: Array<Record<string, any>> }> {
    const normalizedId = String(id)
    const canUseContentId = /^\d+$/.test(normalizedId)

    const latest = await this.draftRepository
      .createQueryBuilder('d')
      .where(canUseContentId ? '(d.homeBannerId = :id OR d.objContentId = :contentId)' : 'd.homeBannerId = :id', {
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
        home_banner_id: row.homeBannerId,
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

  async getRevisionSnapshot(id: string, rev: number, lang?: string): Promise<HomeBannerDraft | null> {
    const normalizedId = String(id)
    const canUseContentId = /^\d+$/.test(normalizedId)

    const latest = await this.draftRepository
      .createQueryBuilder('d')
      .where(canUseContentId ? '(d.homeBannerId = :id OR d.objContentId = :contentId)' : 'd.homeBannerId = :id', {
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

    return (await this.withDynamicChildren(row)) as HomeBannerDraft
  }

  async update(id: string, updateDto: UpdateHomeBannerDto): Promise<HomeBannerDraft | null> {
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

    const { sanitizedRest, childRows, galleryRows, childSource, gallerySource } = this.extractDynamicCollections(rest as Record<string, any>)
    this.logger.log(
      `[update] id=${id} payloadKeys=${Object.keys(rest || {}).join(',') || '-'} childSource=${childSource || '-'} childCount=${childRows?.length ?? -1} gallerySource=${gallerySource || '-'} galleryCount=${galleryRows?.length ?? -1}`,
    )
    const normalizedRest = this.normalizeInput(sanitizedRest, 'update')

    if (obj_content_id && String(obj_content_id) !== String(existing.homeBannerId)) {
      this.logger.warn(`[update] Ignoring client obj_content_id=${obj_content_id}; obj_content_id will match homeBannerId=${existing.homeBannerId}.`)
    }

    await this.archiveCurrentRevision(existing, obj_modified_by)

    const contentId = String(existing.objContentId)
    const nextRev = await this.nextRevision(contentId)
    const publishFlag = this.shouldPublish(publish, obj_state)

    const merged = this.draftRepository.create({
      ...existing,
      ...normalizedRest,
      objStatus: 'active',
      objState: publishFlag ? 'published' : obj_state || existing.objState || 'draft',
      objLang: obj_lang || existing.objLang || 'en',
      objRev: nextRev,
      objContentId: contentId,
      objModifiedBy: obj_modified_by ?? existing.objModifiedBy ?? existing.objCreatedBy,
      objPublishedDate: publishFlag ? (existing.objPublishedDate || new Date()) : null,
      objPublishedBy: publishFlag ? obj_published_by ?? existing.objPublishedBy ?? existing.objCreatedBy : null,
    })

    const savedDraft = await this.draftRepository.save(merged)

    const resolvedChildRows = childRows ?? (await this.getDraftChildRows(existing.homeBannerId, existing.objRev))
    const resolvedGalleryRows = galleryRows ?? (await this.getDraftGalleryRows(existing.homeBannerId, existing.objRev))

    await this.replaceDraftChildren(savedDraft.homeBannerId, resolvedChildRows, resolvedGalleryRows, savedDraft)
    this.logger.log(
      `[update] saved parentId=${savedDraft.homeBannerId} draftChild=${resolvedChildRows.length} draftGallery=${resolvedGalleryRows.length}`,
    )

    if (publishFlag) {
      const published = this.homeBannerRepository.create({
        homeBannerId: savedDraft.homeBannerId,
        title: savedDraft.title,
        banner: savedDraft.banner,
        bannerGen: savedDraft.bannerGen,
        bannerAlt: savedDraft.bannerAlt,
        bannerVideo: savedDraft.bannerVideo,
        bannerVideoGen: savedDraft.bannerVideoGen,
        mode: savedDraft.mode,
        objLang: savedDraft.objLang,
        objContentId: savedDraft.objContentId,
        objCreatedDate: savedDraft.objCreatedDate,
        objCreatedBy: savedDraft.objCreatedBy,
        objPublishedDate: savedDraft.objPublishedDate,
        objPublishedBy: savedDraft.objPublishedBy,
      })
      await this.homeBannerRepository.save(published)

      await this.replacePublishedChildren(savedDraft.homeBannerId, resolvedChildRows, resolvedGalleryRows, savedDraft)
    }

    await this.trimRevisionWindow(contentId)

    return (await this.withDynamicChildren(savedDraft)) as HomeBannerDraft
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
        objModifiedDate: new Date(),
        objModifiedBy: deleterId,
        objPublishedDate: null,
        objPublishedBy: null,
      }),
    )

    await this.detailRepository.delete({ objParentId: existing.homeBannerId })
    await this.galleryRepository.delete({ objParentId: existing.homeBannerId })
    await this.homeBannerRepository.delete({ homeBannerId: existing.homeBannerId })

    await this.trimRevisionWindow(String(existing.objContentId))
    this.logger.log(`[delete] id=${existing.homeBannerId} by=${deleterId}`)
  }
}
