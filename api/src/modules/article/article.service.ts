import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { promises as fs } from 'fs'
import * as path from 'path'
import { Article } from './article.entity'
import { ArticleDraft } from './article-draft.entity'
import { CreateArticleDto } from './dto/create-article.dto'
import { UpdateArticleDto } from './dto/update-article.dto'
import { OMUtilts } from '../../common/utils/OMUtilts.util'

type LookupOption = { value: string; label: string }

@Injectable()
export class ArticleService {
  private readonly logger = new Logger(ArticleService.name)
  private readonly siteSettingsPath = path.join(process.cwd(), 'config', 'site-settings.json')

  constructor(
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    @InjectRepository(ArticleDraft)
    private draftRepository: Repository<ArticleDraft>,
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

  private toSnakeCase(input: string): string {
    return String(input || '')
      .replace(/-/g, '_')
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .toLowerCase()
  }

  private firstNonEmptyString(...values: unknown[]): string {
    for (const value of values) {
      const str = String(value ?? '')
      if (str.trim() !== '') {
        return str
      }
    }
    return ''
  }

  private getWysiwygStem(fieldName: string): string {
    return String(fieldName || '')
      .replace(/-wysiwyg$/i, '')
      .replace(/_wysiwyg$/i, '')
      .replace(/Wysiwyg$/, '')
  }

  private normalizeArticleInput(payload: Record<string, any>) {
    const normalized = { ...payload }

    const wysiwygEntries = Object.entries(payload || {}).filter(([key, value]) => {
      if (value === undefined || value === null) return false
      return /wysiwyg/i.test(key)
    })

    for (const [rawKey, rawValue] of wysiwygEntries) {
      const stem = this.getWysiwygStem(rawKey)
      const plainKey = `${this.toSnakeCase(stem)}_plain`
      const painKey = `${this.toSnakeCase(stem)}_pain`
      const plainText = this.stripHtmlToText(rawValue)
      normalized[plainKey] = plainText
      normalized[painKey] = plainText
    }

    normalized.thumbnail = normalized.thumbnail ?? normalized.thumbnailName ?? normalized.thumbnail_name ?? ''
    normalized.thumbnailGen = normalized.thumbnailGen ?? normalized.thumbnail_gen ?? ''
    normalized.video = normalized.video ?? normalized.video_name ?? null
    normalized.videoGen = normalized.videoGen ?? normalized.video_gen ?? null
    normalized.file = normalized.file ?? normalized.document ?? normalized.file_name ?? null
    normalized.fileGen = normalized.fileGen ?? normalized.file_gen ?? normalized.document_gen ?? null

    const hasAnyWysiwygInput =
      Object.prototype.hasOwnProperty.call(payload, 'content-wysiwyg') ||
      Object.prototype.hasOwnProperty.call(payload, 'content_wysiwyg') ||
      Object.prototype.hasOwnProperty.call(payload, 'contentWysiwyg') ||
      wysiwygEntries.length > 0

    const firstWysiwygValue = wysiwygEntries.length > 0 ? wysiwygEntries[0][1] : undefined
    const resolvedWysiwyg = this.firstNonEmptyString(
      normalized['content-wysiwyg'],
      normalized.content_wysiwyg,
      normalized.contentWysiwyg,
      firstWysiwygValue,
    )

    if (hasAnyWysiwygInput) {
      normalized.contentWysiwyg = resolvedWysiwyg
    }

    const hasAnyPlainInput =
      Object.prototype.hasOwnProperty.call(payload, 'content-wysiwyg_plain') ||
      Object.prototype.hasOwnProperty.call(payload, 'content_wysiwyg_plain') ||
      Object.prototype.hasOwnProperty.call(payload, 'contentWysiwygPlain')

    const resolvedPlain = this.firstNonEmptyString(
      normalized['content-wysiwyg_plain'],
      normalized.content_wysiwyg_plain,
      normalized.contentWysiwygPlain,
      hasAnyWysiwygInput ? this.stripHtmlToText(resolvedWysiwyg) : '',
    )

    if (hasAnyPlainInput || hasAnyWysiwygInput) {
      normalized.contentWysiwygPlain = resolvedPlain
      normalized.content_plain = resolvedPlain
      normalized.content_pain = resolvedPlain
    }

    if ((!normalized.thumbnailAlt || String(normalized.thumbnailAlt).trim() === '') && normalized.thumbnail) {
      normalized.thumbnailAlt = String(normalized.thumbnail).replace(/\.[^/.]+$/, '')
    }

    if (!normalized.thumbnailGen && normalized.thumbnail) {
      normalized.thumbnailGen = this.extractGenFromValue(normalized.thumbnail) || ''
    }

    if (!normalized.videoGen && normalized.video) {
      normalized.videoGen = this.extractGenFromValue(normalized.video) || null
    }

    if (!normalized.fileGen && normalized.file) {
      normalized.fileGen = this.extractGenFromValue(normalized.file) || null
    }

    delete normalized.thumbnailName
    delete normalized.thumbnail_name
    delete normalized.thumbnail_gen
    delete normalized.video_name
    delete normalized.video_gen
    delete normalized.file_name
    delete normalized.file_gen
    delete normalized.document
    delete normalized.document_gen
    delete normalized['content-wysiwyg']
    delete normalized.content_wysiwyg
    delete normalized['content-wysiwyg_plain']
    delete normalized.content_wysiwyg_plain

    return normalized
  }

  private async nextArticleId(): Promise<string> {
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

  private isPublishedState(publish: unknown, objState?: string): boolean {
    if (typeof publish === 'boolean') return publish
    const normalized = String(objState || '').trim().toLowerCase()
    return normalized === 'published' || normalized === 'publish'
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

  private async archiveCurrentRevision(existing: ArticleDraft, actorId?: number): Promise<void> {
    await this.draftRepository.update(
      {
        articlesId: existing.articlesId,
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

    await Promise.all(
      overflow.map((row) =>
        this.draftRepository.delete({
          articlesId: row.articlesId,
          objLang: row.objLang,
          objRev: row.objRev,
        }),
      ),
    )
  }

  private async findActiveDraftByAnyId(id: string): Promise<ArticleDraft | null> {
    const normalizedId = String(id)
    const canUseContentId = /^\d+$/.test(normalizedId)

    return this.draftRepository
      .createQueryBuilder('d')
      .where('d.objStatus = :status', { status: 'active' })
      .andWhere(canUseContentId ? '(d.articlesId = :id OR d.objContentId = :contentId)' : 'd.articlesId = :id', {
        id: normalizedId,
        contentId: normalizedId,
      })
      .orderBy('d.objRev', 'DESC')
      .getOne()
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

  async create(createArticleDto: CreateArticleDto): Promise<ArticleDraft> {
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
      articlesId,
      ...rest
    } = createArticleDto

    const normalizedRest = this.normalizeArticleInput(rest as Record<string, any>)

    if (articlesId) {
      this.logger.warn(`[create] Ignoring client articlesId=${articlesId}; server will generate id.`)
    }
    if (obj_content_id) {
      this.logger.warn(`[create] Ignoring client obj_content_id=${obj_content_id}; obj_content_id will match articlesId.`)
    }
    const newArticleId = await this.nextArticleId()
    const contentId = newArticleId
    const nextRev = obj_rev ?? (await this.nextRevision(contentId))
    const publishFlag = this.isPublishedState(publish, obj_state)

    const draft = this.draftRepository.create({
      articlesId: newArticleId,
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

    if (publishFlag) {
      const published = this.articleRepository.create({
        articlesId: savedDraft.articlesId,
        thumbnail: savedDraft.thumbnail,
        thumbnailGen: savedDraft.thumbnailGen,
        thumbnailAlt: savedDraft.thumbnailAlt,
        video: savedDraft.video,
        videoGen: savedDraft.videoGen,
        file: savedDraft.file,
        fileGen: savedDraft.fileGen,
        title: savedDraft.title,
        author: savedDraft.author,
        date: savedDraft.date,
        content: savedDraft.content,
        contentWysiwyg: savedDraft.contentWysiwyg,
        contentWysiwygPlain: savedDraft.contentWysiwygPlain,
        brandColor: savedDraft.brandColor,
        objLang: savedDraft.objLang,
        objContentId: savedDraft.objContentId,
        objCreatedDate: savedDraft.objCreatedDate,
        objCreatedBy: savedDraft.objCreatedBy,
        objPublishedDate: savedDraft.objPublishedDate,
        objPublishedBy: savedDraft.objPublishedBy,
      })
      await this.articleRepository.save(published)
    }

    return savedDraft
  }

  async findAll(): Promise<ArticleDraft[]> {
    return this.draftRepository.find({
      where: { objStatus: 'active' },
      order: {
        objCreatedDate: 'DESC',
      },
    })
  }

  async getLookup(field?: string, lang?: string): Promise<{ field: string; lang: string; options: LookupOption[] }> {
    const normalizedField = String(field || '')
    const normalizedLang = String(lang || 'en')

    if (field === 'obj_lang') {
      return {
        field: normalizedField || 'obj_lang',
        lang: normalizedLang,
        options: [
        { value: 'en', label: 'English' },
        { value: 'th', label: 'Thai' },
        ],
      }
    }

    if (field === 'obj_state') {
      return {
        field: normalizedField || 'obj_state',
        lang: normalizedLang,
        options: [
        { value: 'publish', label: 'Publish' },
        { value: 'draft', label: 'Draft' },
        { value: 'unpublish', label: 'Unpublish' },
        ],
      }
    }

    return { field: normalizedField, lang: normalizedLang, options: [] }
  }

  async findOne(id: string): Promise<ArticleDraft | null> {
    const draft = await this.findActiveDraftByAnyId(id)

    if (!draft) return null

    const modifierName = await this.resolveUserDisplayName(draft.objModifiedBy)
    return {
      ...draft,
      obj_modified_by_name: modifierName,
      objModifiedByName: modifierName,
    } as ArticleDraft & Record<string, any>
  }

  async getRevisions(id: string): Promise<{ activeRevision: number | null; items: Array<Record<string, any>> }> {
    const normalizedId = String(id)
    const canUseContentId = /^\d+$/.test(normalizedId)

    const latest = await this.draftRepository
      .createQueryBuilder('d')
      .where(canUseContentId ? '(d.articlesId = :id OR d.objContentId = :contentId)' : 'd.articlesId = :id', {
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
        articles_id: row.articlesId,
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

  async getRevisionSnapshot(id: string, rev: number, lang?: string): Promise<ArticleDraft | null> {
    const normalizedId = String(id)
    const canUseContentId = /^\d+$/.test(normalizedId)

    const latest = await this.draftRepository
      .createQueryBuilder('d')
      .where(canUseContentId ? '(d.articlesId = :id OR d.objContentId = :contentId)' : 'd.articlesId = :id', {
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

    const modifierName = await this.resolveUserDisplayName(row.objModifiedBy)
    return {
      ...row,
      obj_modified_by_name: modifierName,
      objModifiedByName: modifierName,
    } as ArticleDraft & Record<string, any>
  }

  async update(id: string, updateArticleDto: UpdateArticleDto): Promise<ArticleDraft | null> {
    const existing = await this.findActiveDraftByAnyId(id)
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
    } = updateArticleDto

    const normalizedRest = this.normalizeArticleInput(rest as Record<string, any>)

    if (obj_content_id && String(obj_content_id) !== String(existing.articlesId)) {
      this.logger.warn(`[update] Ignoring client obj_content_id=${obj_content_id}; obj_content_id will match articlesId=${existing.articlesId}.`)
    }

    await this.archiveCurrentRevision(existing, obj_modified_by)

    const contentId = String(existing.objContentId)
    const nextRev = await this.nextRevision(contentId)
    const publishFlag = this.isPublishedState(publish, obj_state)

    const merged = this.draftRepository.create({
      ...existing,
      ...normalizedRest,
      objState: publishFlag ? 'published' : obj_state || existing.objState || 'draft',
      objLang: obj_lang || existing.objLang || 'en',
      objRev: nextRev,
      objStatus: 'active',
      objContentId: contentId,
      objModifiedBy: obj_modified_by ?? existing.objModifiedBy ?? existing.objCreatedBy,
      objPublishedDate: publishFlag ? (existing.objPublishedDate || new Date()) : null,
      objPublishedBy: publishFlag ? obj_published_by ?? existing.objPublishedBy ?? existing.objCreatedBy : null,
    })

    const savedDraft = await this.draftRepository.save(merged)

    if (publishFlag) {
      const published = this.articleRepository.create({
        articlesId: savedDraft.articlesId,
        thumbnail: savedDraft.thumbnail,
        thumbnailGen: savedDraft.thumbnailGen,
        thumbnailAlt: savedDraft.thumbnailAlt,
        video: savedDraft.video,
        videoGen: savedDraft.videoGen,
        file: savedDraft.file,
        fileGen: savedDraft.fileGen,
        title: savedDraft.title,
        author: savedDraft.author,
        date: savedDraft.date,
        content: savedDraft.content,
        contentWysiwyg: savedDraft.contentWysiwyg,
        contentWysiwygPlain: savedDraft.contentWysiwygPlain,
        brandColor: savedDraft.brandColor,
        objLang: savedDraft.objLang,
        objContentId: savedDraft.objContentId,
        objCreatedDate: savedDraft.objCreatedDate,
        objCreatedBy: savedDraft.objCreatedBy,
        objPublishedDate: savedDraft.objPublishedDate,
        objPublishedBy: savedDraft.objPublishedBy,
      })
      await this.articleRepository.save(published)
    } else {
      await this.articleRepository.delete({ articlesId: savedDraft.articlesId })
    }

    await this.trimRevisionWindow(contentId)

    return savedDraft
  }

  async remove(id: string, actorId?: number): Promise<void> {
    const existing = await this.findActiveDraftByAnyId(id)
    if (!existing) return

    await this.archiveCurrentRevision(existing, actorId)

    const nextRev = await this.nextRevision(String(existing.objContentId))
    const now = new Date()
    const deleterId = actorId ?? existing.objModifiedBy ?? existing.objCreatedBy

    await this.draftRepository.save(
      this.draftRepository.create({
        ...existing,
        objStatus: 'delete',
        objRev: nextRev,
        objState: 'draft',
        objModifiedBy: deleterId,
        objModifiedDate: now,
        objPublishedDate: null,
        objPublishedBy: null,
      }),
    )

    await this.articleRepository.delete({ articlesId: existing.articlesId })
    await this.trimRevisionWindow(String(existing.objContentId))

    this.logger.log(`[delete] id=${existing.articlesId} by=${deleterId}`)
  }
}
