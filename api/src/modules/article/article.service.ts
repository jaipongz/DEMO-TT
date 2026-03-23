import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm'
import { promises as fs } from 'fs'
import * as path from 'path'
import { Article } from './article.entity'
import { ArticleDraft } from './article-draft.entity'
import { CreateArticleDto } from './dto/create-article.dto'
import { UpdateArticleDto } from './dto/update-article.dto'
import { OMDatetime } from '../../common/utils/OMDatetime.util'
import { OMUtilts } from '../../common/utils/OMUtilts.util'

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
export class ArticleService {
    private readonly logger = new Logger(ArticleService.name)
    private readonly siteSettingsPath = path.join(process.cwd(), 'config', 'site-settings.json')
    private readonly tableLookupMap: Record<string, TableLookupConfig> = {
    }
    private readonly listFieldMap: Record<string, keyof ArticleDraft> = {
        article_id: 'articleId',
        title: 'title',
        short_description: 'shortDescription',
        thumbnail: 'thumbnail',
        obj_state: 'objState',
        obj_lang: 'objLang',
        obj_modified_date: 'objModifiedDate',
        obj_created_date: 'objCreatedDate',
        obj_content_id: 'objContentId',
    }

    constructor(
        @InjectRepository(Article)
        private mainRepository: Repository<Article>,
        @InjectRepository(ArticleDraft)
        private draftRepository: Repository<ArticleDraft>,
    ) {}

    private resolveLang(lang?: string): string {
        const normalized = String(lang || '').trim().toLowerCase()
        return normalized || 'en'
    }

    private async queryTableLookup(config: TableLookupConfig, lang: string): Promise<LookupOption[]> {
        const labelColumn = config.labelColumn
        const valueColumn = config.valueColumn

        const qb = this.draftRepository.manager
            .createQueryBuilder()
            .select(`${config.tableName}.${valueColumn}`, 'value')
            .addSelect(`${config.tableName}.${labelColumn}`, 'label')
            .from(config.tableName, config.tableName)

        const orderByColumn = config.orderBy?.column || labelColumn
        const orderByDirection = String(config.orderBy?.direction || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC'

        if (config.whereSql && config.whereSql.trim() !== '') {
            qb.where(config.whereSql)
        }

        if (config.langColumn && lang !== '') {
            qb.andWhere(`${config.tableName}.${config.langColumn} = :lang`, { lang })
        }

        qb.orderBy(`${config.tableName}.${orderByColumn}`, orderByDirection as 'ASC' | 'DESC')

        const rows = await qb.getRawMany<{ value: string | number; label: string }>()

        return rows.map((row) => ({
            value: String(row.value),
            label: String(row.label || row.value),
        }))
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

    private toObjectArray(value: unknown): Array<Record<string, any>> {
        if (Array.isArray(value)) {
            return value.filter((item) => item && typeof item === 'object') as Array<Record<string, any>>
        }

        const raw = String(value ?? '').trim()
        if (!raw) return []

        try {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed)) {
                return parsed.filter((item) => item && typeof item === 'object') as Array<Record<string, any>>
            }
        } catch {
            // ignore
        }

        return []
    }

    private normalizeKey(input: string): string {
        return String(input || '').trim().toLowerCase().replace(/[\s-]+/g, '_')
    }

    private toCamelCaseKey(input: string): string {
        return String(input || '')
            .replace(/[-_]+([a-zA-Z0-9])/g, (_, char: string) => String(char).toUpperCase())
            .replace(/^([A-Z])/, (char: string) => char.toLowerCase())
    }

    private mapPayloadToEntityFields(payload: Record<string, any>): Record<string, any> {
        const mapped: Record<string, any> = { ...payload }

        Object.entries(payload || {}).forEach(([key, value]) => {
            const camelKey = this.toCamelCaseKey(key)
            if (!camelKey) return
            if (mapped[camelKey] === undefined) {
                mapped[camelKey] = value
            }
        })

        return mapped
    }

    private extractCollections(payload: Record<string, any>): {
        sanitizedRest: Record<string, any>
        childCollectionRows: Record<string, Array<Record<string, any>>>
        galleryCollectionRows: Record<string, Array<Record<string, any>>>
        childCollectionProvided: Record<string, boolean>
        galleryCollectionProvided: Record<string, boolean>
    } {
        const sanitizedRest = { ...payload }
        const consumedKeys = new Set<string>()
        const childCollectionRows: Record<string, Array<Record<string, any>>> = {
        }
        const galleryCollectionRows: Record<string, Array<Record<string, any>>> = {
        }
        const childCollectionProvided: Record<string, boolean> = {
        }
        const galleryCollectionProvided: Record<string, boolean> = {
        }

        Object.entries(sanitizedRest).forEach(([rawKey, rawValue]) => {
            const normalizedRawKey = this.normalizeKey(rawKey)

            if (normalizedRawKey.startsWith('__child_')) {
                const suffix = this.normalizeKey(rawKey.replace(/^__child_/i, ''))
            }


            if (normalizedRawKey.startsWith('__gallery_')) {
            const suffix = this.normalizeKey(rawKey.replace(/^__gallery_/i, ''))
            }

        })

        Object.keys(sanitizedRest).forEach((key) => {
            if (key.startsWith('__child_') || key.startsWith('__gallery_') || consumedKeys.has(key)) {
                delete sanitizedRest[key]
            }
        })

        return { sanitizedRest, childCollectionRows, galleryCollectionRows, childCollectionProvided, galleryCollectionProvided }
    }

    private parseFilters(query: ListQueryInput): Record<string, string[]> {
        const result: Record<string, string[]> = {}

        const incomingFilters = query.filters
        if (incomingFilters && typeof incomingFilters === 'object' && !Array.isArray(incomingFilters)) {
            Object.entries(incomingFilters).forEach(([key, raw]) => {
                const values = this.toStringArray(raw)
                if (values.length > 0) result[key] = values
            })
        }

        Object.entries(query).forEach(([key, rawValue]) => {
            if (!key.startsWith('filter_')) return
            const field = key.replace(/^filter_/, '').trim()
            if (!field) return
            const values = this.toStringArray(rawValue)
            if (values.length > 0) result[field] = values
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

        return { page, pageSize, search, searchFields, sortField, sortDirection, filters }
    }

    private resolveColumn(field: string): keyof ArticleDraft | undefined {
        const raw = String(field || '').trim()
        if (!raw) return undefined
        return this.listFieldMap[raw]
    }

    private applySearch(qb: SelectQueryBuilder<ArticleDraft>, term: string, fields: string[]): void {
        if (!term) return

        const resolvedColumns = fields
            .map((field) => this.resolveColumn(field))
            .filter((field): field is keyof ArticleDraft => Boolean(field))

        const fallback = ['obj_state']
            .map((field) => this.resolveColumn(field))
            .filter((field): field is keyof ArticleDraft => Boolean(field))

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

    private applyFilters(qb: SelectQueryBuilder<ArticleDraft>, filters: Record<string, string[]>): void {
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

    private applySort(qb: SelectQueryBuilder<ArticleDraft>, sortField: string, sortDirection: 'ASC' | 'DESC'): void {
        const column = this.resolveColumn(sortField) || this.resolveColumn('obj_modified_date') || 'objModifiedDate'
        qb.orderBy(`d.${String(column)}`, sortDirection)
    }

    private buildListQuery(query?: ListQueryInput): { qb: SelectQueryBuilder<ArticleDraft>; normalized: NormalizedListQuery } {
        const normalized = this.normalizeQuery(query)
        const qb = this.draftRepository.createQueryBuilder('d')

        qb.andWhere('d.objStatus = :activeStatus', { activeStatus: 'active' })
        this.applySearch(qb, normalized.search, normalized.searchFields)
        this.applyFilters(qb, normalized.filters)
        this.applySort(qb, normalized.sortField, normalized.sortDirection)

        return { qb, normalized }
    }

    private async nextId(): Promise<string> {
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

    private async trimRevisionWindow(contentId: string): Promise<void> {
        const maxRevision = await this.getMaxRevision()
        const rows = await this.draftRepository.find({
            where: { objContentId: contentId } as any,
            order: { objRev: 'DESC', objModifiedDate: 'DESC' } as any,
        })

        if (rows.length <= maxRevision) return

        const overflow = rows.slice(maxRevision)
        if (overflow.length === 0) return

        for (const row of overflow) {
            await this.draftRepository.delete({
                articleId: (row as any).articleId,
                objLang: (row as any).objLang,
                objRev: (row as any).objRev,
            } as any)
        }
    }

    private shouldPublish(publishFlag: unknown, objState?: string): boolean {
        if (typeof publishFlag === 'boolean') return publishFlag
        const normalized = String(objState || '').trim().toLowerCase()
        return normalized === 'publish' || normalized === 'published'
    }

    private normalizePayloadForSave(payload: Record<string, any>): Record<string, any> {
        const normalized = { ...payload }

        if (normalized['thumbnail_gen'] === undefined || normalized['thumbnail_gen'] === null) {
            normalized['thumbnail_gen'] = normalized['thumbnail'] ? 'N' : ''
        }

        return normalized
    }

    private async loadDraftCollections(parentId: string, objRev: number): Promise<{
        childCollectionRows: Record<string, Array<Record<string, any>>>
        galleryCollectionRows: Record<string, Array<Record<string, any>>>
    }> {
        const childCollectionRows: Record<string, Array<Record<string, any>>> = {}
        const galleryCollectionRows: Record<string, Array<Record<string, any>>> = {}


        return { childCollectionRows, galleryCollectionRows }
    }

    private attachCollectionsToDraft(
        draft: ArticleDraft,
        childCollectionRows: Record<string, Array<Record<string, any>>>,
        galleryCollectionRows: Record<string, Array<Record<string, any>>>,
    ): ArticleDraft & Record<string, any> {
        const hydrated: Record<string, any> = { ...draft }


        return hydrated as ArticleDraft & Record<string, any>
    }

    private async findActiveDraftById(id: string): Promise<ArticleDraft | null> {
        return this.draftRepository
            .createQueryBuilder('d')
            .where('d.objStatus = :status', { status: 'active' })
            .andWhere('(d.articleId = :id OR d.objContentId = :id)', { id })
            .orderBy('d.objRev', 'DESC')
            .getOne()
    }

    private async replaceDraftCollections(parentId: string, draft: ArticleDraft, childCollectionRows: Record<string, Array<Record<string, any>>>, galleryCollectionRows: Record<string, Array<Record<string, any>>>): Promise<void> {
    }

    private async replacePublishedCollections(parentId: string, draft: ArticleDraft, childCollectionRows: Record<string, Array<Record<string, any>>>, galleryCollectionRows: Record<string, Array<Record<string, any>>>): Promise<void> {
    }

    async create(createDto: CreateArticleDto): Promise<ArticleDraft> {
        const { publish, obj_state, obj_status, obj_lang, obj_rev, obj_created_by, obj_modified_by, obj_published_by, ...rest } = createDto as any
        const { sanitizedRest, childCollectionRows, galleryCollectionRows } = this.extractCollections(rest as Record<string, any>)
        const newId = await this.nextId()
        const contentId = newId
        const nextRev = obj_rev ?? (await this.nextRevision(contentId))
        const publishFlag = this.shouldPublish(publish, obj_state)
        const nowUtc = OMDatetime.getUtcNow()

        const normalizedRest = this.normalizePayloadForSave(this.mapPayloadToEntityFields(sanitizedRest))

        const draft = this.draftRepository.create({
            ...normalizedRest,
            articleId: newId,
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
        } as any) as unknown as ArticleDraft

        const savedDraft: ArticleDraft = await this.draftRepository.save(draft as ArticleDraft)
        await this.replaceDraftCollections((savedDraft as any).articleId, savedDraft, childCollectionRows, galleryCollectionRows)

        if (publishFlag) {
            const published = this.mainRepository.create(savedDraft as unknown as Article)
            await this.mainRepository.save(published)
            await this.replacePublishedCollections((savedDraft as any).articleId, savedDraft, childCollectionRows, galleryCollectionRows)
        }

        await this.trimRevisionWindow(contentId)

        return savedDraft
    }

    async findAll(query?: ListQueryInput): Promise<ArticleDraft[] | { items: ArticleDraft[]; total: number; page: number; pageSize: number }> {
        if (!query || Object.keys(query).length === 0) {
            return this.draftRepository.find({ where: { objStatus: 'active' } as any, order: { objModifiedDate: 'DESC' } as any })
        }

        const { qb, normalized } = this.buildListQuery(query)
        qb.skip((normalized.page - 1) * normalized.pageSize)
        qb.take(normalized.pageSize)

        const [items, total] = await qb.getManyAndCount()
        return { items, total, page: normalized.page, pageSize: normalized.pageSize }
    }

    async findOne(id: string): Promise<ArticleDraft | null> {
        const row = await this.findActiveDraftById(id)

        if (!row) return null
        const { childCollectionRows, galleryCollectionRows } = await this.loadDraftCollections(
            String((row as any).articleId),
            Number((row as any).objRev),
        )
        return this.attachCollectionsToDraft(row, childCollectionRows, galleryCollectionRows)
    }

    async update(id: string, updateDto: UpdateArticleDto): Promise<ArticleDraft | null> {
        const existing = await this.findActiveDraftById(id)
        if (!existing) return null

        const { publish, obj_state, obj_lang, obj_modified_by, obj_published_by, ...rest } = updateDto as any
        const { sanitizedRest, childCollectionRows, galleryCollectionRows, childCollectionProvided, galleryCollectionProvided } = this.extractCollections(rest as Record<string, any>)

        await this.draftRepository.update(
            { articleId: (existing as any).articleId, objLang: existing.objLang, objRev: existing.objRev } as any,
            { objStatus: 'archive', objModifiedBy: obj_modified_by ?? (existing as any).objModifiedBy, objModifiedDate: OMDatetime.getUtcNow() } as any,
        )

        const contentId = String((existing as any).objContentId)
        const nextRev = await this.nextRevision(contentId)
        const publishFlag = this.shouldPublish(publish, obj_state)
        const nowUtc = OMDatetime.getUtcNow()

        const normalizedRest = this.normalizePayloadForSave(this.mapPayloadToEntityFields(sanitizedRest))

        const merged = this.draftRepository.create({
            ...existing,
            ...normalizedRest,
            objState: publishFlag ? 'published' : obj_state || (existing as any).objState || 'draft',
            objLang: obj_lang || (existing as any).objLang || 'en',
            objRev: nextRev,
            objModifiedDate: nowUtc,
            objModifiedBy: obj_modified_by ?? (existing as any).objModifiedBy,
            objPublishedDate: publishFlag ? nowUtc : null,
            objPublishedBy: publishFlag ? obj_published_by ?? (existing as any).objCreatedBy : null,
        } as any) as unknown as ArticleDraft

        const savedDraft: ArticleDraft = await this.draftRepository.save(merged as ArticleDraft)

        const hasChildPayload = Object.values(childCollectionProvided).some(Boolean)
        const hasGalleryPayload = Object.values(galleryCollectionProvided).some(Boolean)

        const loadedPrevious = (!hasChildPayload && !hasGalleryPayload)
            ? await this.loadDraftCollections(String((existing as any).articleId), Number((existing as any).objRev))
            : { childCollectionRows: {}, galleryCollectionRows: {} }

        const resolvedChildCollectionRows = hasChildPayload
            ? childCollectionRows
            : (loadedPrevious.childCollectionRows || {})

        const resolvedGalleryCollectionRows = hasGalleryPayload
            ? galleryCollectionRows
            : (loadedPrevious.galleryCollectionRows || {})

        await this.replaceDraftCollections(String((savedDraft as any).articleId), savedDraft, resolvedChildCollectionRows, resolvedGalleryCollectionRows)

        if (publishFlag) {
            await this.mainRepository.save(this.mainRepository.create(savedDraft as unknown as Article))
            await this.replacePublishedCollections(String((savedDraft as any).articleId), savedDraft, resolvedChildCollectionRows, resolvedGalleryCollectionRows)
        } else {
            await this.mainRepository.delete({ articleId: (savedDraft as any).articleId } as any)
        }

        await this.trimRevisionWindow(contentId)

        return savedDraft
    }

    async remove(id: string, actorId?: number): Promise<void> {
        const existing = await this.findActiveDraftById(id)
        if (!existing) return

        const nextRev = await this.nextRevision(String((existing as any).objContentId))

        await this.draftRepository.save(
            this.draftRepository.create({
                ...existing,
                objStatus: 'delete',
                objState: 'draft',
                objRev: nextRev,
                objModifiedDate: OMDatetime.getUtcNow(),
                objModifiedBy: actorId ?? (existing as any).objModifiedBy ?? (existing as any).objCreatedBy,
                objPublishedDate: null,
                objPublishedBy: null,
            } as any),
        )

        await this.mainRepository.delete({ articleId: (existing as any).articleId } as any)

        await this.trimRevisionWindow(String((existing as any).objContentId))
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

    async exportRows(payload?: ListQueryInput & { fields?: string[] }): Promise<{ fields: string[]; total: number; items: Record<string, any>[] }> {
        const requestedFields = Array.isArray(payload?.fields)
            ? payload?.fields.map((field) => String(field || '').trim()).filter(Boolean)
            : []

        const selectedPairs = requestedFields
            .map((field) => ({ field, column: this.resolveColumn(field) }))
            .filter((item): item is { field: string; column: keyof ArticleDraft } => Boolean(item.column))

        const fallbackFields = ['article_id', 'obj_state', 'obj_lang', 'obj_modified_date']
        const pairs = selectedPairs.length > 0
            ? selectedPairs
            : fallbackFields
                    .map((field) => ({ field, column: this.resolveColumn(field) }))
                    .filter((item): item is { field: string; column: keyof ArticleDraft } => Boolean(item.column))

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

    async getLookup(field?: string, lang?: string): Promise<LookupResponse> {
        const normalizedField = String(field || '')
        const normalizedLang = this.resolveLang(lang)

        const map: Record<string, Array<{ value: string; label: string }>> = {
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

    async getRevisions(id: string): Promise<{ activeRevision: number | null; items: Array<Record<string, any>> }> {
        const current = await this.findActiveDraftById(id)
        const contentId = String((current as any)?.objContentId || id || '').trim()
        if (!contentId) {
            return { activeRevision: null, items: [] }
        }

        const rows = await this.draftRepository
            .createQueryBuilder('d')
            .where('d.objContentId = :contentId', { contentId })
            .orderBy('d.objRev', 'DESC')
            .addOrderBy('d.objModifiedDate', 'DESC')
            .getMany()

        const items = rows.map((row) => ({
            article_id: (row as any).articleId,
            obj_content_id: (row as any).objContentId,
            obj_lang: (row as any).objLang,
            obj_rev: (row as any).objRev,
            obj_status: (row as any).objStatus,
            obj_state: (row as any).objState,
            obj_modified_by: (row as any).objModifiedBy,
            obj_modified_by_name: '-',
            obj_modified_date: (row as any).objModifiedDate,
            obj_published_date: (row as any).objPublishedDate,
            is_active: String((row as any).objStatus || '').toLowerCase() === 'active',
        }))

        return {
            activeRevision: current ? Number((current as any).objRev || 0) : null,
            items,
        }
    }

    async getRevisionSnapshot(id: string, rev: number, lang?: string): Promise<ArticleDraft | null> {
        const normalizedRev = Number(rev) || 0
        if (normalizedRev <= 0) return null

        const current = await this.findActiveDraftById(id)
        const contentId = String((current as any)?.objContentId || id || '').trim()
        if (!contentId) return null

        const qb = this.draftRepository
            .createQueryBuilder('d')
            .where('d.objContentId = :contentId', { contentId })
            .andWhere('d.objRev = :rev', { rev: normalizedRev })

        const normalizedLang = String(lang || '').trim()
        if (normalizedLang) {
            qb.andWhere('d.objLang = :lang', { lang: normalizedLang })
        }

        const row = await qb
            .orderBy('d.objModifiedDate', 'DESC')
            .getOne()

        if (!row) return null

        const { childCollectionRows, galleryCollectionRows } = await this.loadDraftCollections(
            String((row as any).articleId),
            Number((row as any).objRev),
        )

        return this.attachCollectionsToDraft(row, childCollectionRows, galleryCollectionRows)
    }
}
