import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm'
import { promises as fs } from 'fs'
import * as path from 'path'
import { DemoJpTest } from './demo_jp_test.entity'
import { DemoJpTestDraft } from './demo_jp_test-draft.entity'
import { CreateDemoJpTestDto } from './dto/create-demo_jp_test.dto'
import { UpdateDemoJpTestDto } from './dto/update-demo_jp_test.dto'
import { DemoJpChild } from './demo_jp_child.entity'
import { DemoJpChildDraft } from './demo_jp_child-draft.entity'
import { DemoJpGallery } from './demo_jp_gallery.entity'
import { DemoJpGalleryDraft } from './demo_jp_gallery-draft.entity'
import { KoreaGallery } from './korea_gallery.entity'
import { KoreaGalleryDraft } from './korea_gallery-draft.entity'
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
export class DemoJpTestService {
    private readonly logger = new Logger(DemoJpTestService.name)
    private readonly siteSettingsPath = path.join(process.cwd(), 'config', 'site-settings.json')
    private readonly tableLookupMap: Record<string, TableLookupConfig> = {
        province: {
            tableName: 'province',
            valueColumn: 'province_id',
            labelColumn: 'title_tha',
            orderBy: {
                column: 'title_tha',
                direction: 'ASC',
            },
        },
        article: {
            tableName: 'article',
            valueColumn: 'article_id',
            labelColumn: 'title',
            orderBy: {
                column: 'title',
                direction: 'ASC',
            },
        },
        home_banner_tags: {
            tableName: 'home_banner',
            valueColumn: 'id',
            labelColumn: 'title',
            orderBy: {
                column: 'title',
                direction: 'ASC',
            },
        },
    }
    private readonly listFieldMap: Record<string, keyof DemoJpTestDraft> = {
        demo_jp_test_id: 'demoJpTestId',
        title: 'title',
        email: 'email',
        age: 'age',
        brand_color: 'brandColor',
        published_date: 'publishedDate',
        published_at: 'publishedAt',
        category: 'category',
        province: 'province',
        article: 'article',
        home_banner_tags: 'homeBannerTags',
        status: 'status',
        flags: 'flags',
        is_active: 'isActive',
        summary: 'summary',
        content: 'content',
        thumbnail: 'thumbnail',
        intro_video: 'introVideo',
        attachment: 'attachment',
        obj_state: 'objState',
        obj_lang: 'objLang',
        obj_modified_date: 'objModifiedDate',
        obj_created_date: 'objCreatedDate',
        obj_content_id: 'objContentId',
    }

    constructor(
        @InjectRepository(DemoJpTest)
        private mainRepository: Repository<DemoJpTest>,
        @InjectRepository(DemoJpTestDraft)
        private draftRepository: Repository<DemoJpTestDraft>,
        @InjectRepository(DemoJpChild)
        private demo_jp_childRepository: Repository<DemoJpChild>,
        @InjectRepository(DemoJpChildDraft)
        private demo_jp_childDraftRepository: Repository<DemoJpChildDraft>,
        @InjectRepository(DemoJpGallery)
        private demo_jp_galleryRepository: Repository<DemoJpGallery>,
        @InjectRepository(DemoJpGalleryDraft)
        private demo_jp_galleryDraftRepository: Repository<DemoJpGalleryDraft>,
        @InjectRepository(KoreaGallery)
        private korea_galleryRepository: Repository<KoreaGallery>,
        @InjectRepository(KoreaGalleryDraft)
        private korea_galleryDraftRepository: Repository<KoreaGalleryDraft>,
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

    private extractCollections(payload: Record<string, any>): {
        sanitizedRest: Record<string, any>
        childCollectionRows: Record<string, Array<Record<string, any>>>
        galleryCollectionRows: Record<string, Array<Record<string, any>>>
        childCollectionProvided: Record<string, boolean>
        galleryCollectionProvided: Record<string, boolean>
    } {
        const sanitizedRest = { ...payload }
        const childCollectionRows: Record<string, Array<Record<string, any>>> = {
            'demo_jp_child': [],
        }
        const galleryCollectionRows: Record<string, Array<Record<string, any>>> = {
            'demo_jp_gallery': [],
            'korea_gallery': [],
        }
        const childCollectionProvided: Record<string, boolean> = {
            'demo_jp_child': false,
        }
        const galleryCollectionProvided: Record<string, boolean> = {
            'demo_jp_gallery': false,
            'korea_gallery': false,
        }

        Object.entries(sanitizedRest).forEach(([rawKey, rawValue]) => {
            const normalizedRawKey = this.normalizeKey(rawKey)

            if (normalizedRawKey.startsWith('__child_')) {
            const suffix = this.normalizeKey(rawKey.replace(/^__child_/i, ''))
            if (suffix === this.normalizeKey('demo_jp_child') || suffix.startsWith(`${this.normalizeKey('demo_jp_child')}_list`)) {
                childCollectionRows['demo_jp_child'] = this.toObjectArray(rawValue)
                childCollectionProvided['demo_jp_child'] = true
            }
            }

            if (normalizedRawKey.startsWith('__gallery_')) {
            const suffix = this.normalizeKey(rawKey.replace(/^__gallery_/i, ''))
            if (suffix === this.normalizeKey('demo_jp_gallery')) {
                galleryCollectionRows['demo_jp_gallery'] = this.toObjectArray(rawValue)
                galleryCollectionProvided['demo_jp_gallery'] = true
            }
            if (suffix === this.normalizeKey('korea_gallery')) {
                galleryCollectionRows['korea_gallery'] = this.toObjectArray(rawValue)
                galleryCollectionProvided['korea_gallery'] = true
            }
            }
        })

        Object.keys(sanitizedRest).forEach((key) => {
            if (key.startsWith('__child_') || key.startsWith('__gallery_')) {
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

    private resolveColumn(field: string): keyof DemoJpTestDraft | undefined {
        const raw = String(field || '').trim()
        if (!raw) return undefined
        return this.listFieldMap[raw]
    }

    private applySearch(qb: SelectQueryBuilder<DemoJpTestDraft>, term: string, fields: string[]): void {
        if (!term) return

        const resolvedColumns = fields
            .map((field) => this.resolveColumn(field))
            .filter((field): field is keyof DemoJpTestDraft => Boolean(field))

        const fallback = ['obj_state']
            .map((field) => this.resolveColumn(field))
            .filter((field): field is keyof DemoJpTestDraft => Boolean(field))

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

    private applyFilters(qb: SelectQueryBuilder<DemoJpTestDraft>, filters: Record<string, string[]>): void {
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

    private applySort(qb: SelectQueryBuilder<DemoJpTestDraft>, sortField: string, sortDirection: 'ASC' | 'DESC'): void {
        const column = this.resolveColumn(sortField) || this.resolveColumn('obj_modified_date') || 'objModifiedDate'
        qb.orderBy(`d.${String(column)}`, sortDirection)
    }

    private buildListQuery(query?: ListQueryInput): { qb: SelectQueryBuilder<DemoJpTestDraft>; normalized: NormalizedListQuery } {
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

    private shouldPublish(publishFlag: unknown, objState?: string): boolean {
        if (typeof publishFlag === 'boolean') return publishFlag
        const normalized = String(objState || '').trim().toLowerCase()
        return normalized === 'publish' || normalized === 'published'
    }

    private normalizePayloadForSave(payload: Record<string, any>): Record<string, any> {
        const normalized = { ...payload }

        if (Array.isArray(normalized['home_banner_tags'])) {
            normalized['home_banner_tags'] = JSON.stringify(
                normalized['home_banner_tags'].map((item: unknown) => String(item ?? '').trim()).filter(Boolean),
            )
        }
        if (Array.isArray(normalized['flags'])) {
            normalized['flags'] = JSON.stringify(
                normalized['flags'].map((item: unknown) => String(item ?? '').trim()).filter(Boolean),
            )
        }
        if (typeof normalized['is_active'] === 'boolean') {
            normalized['is_active'] = normalized['is_active'] ? 1 : 0
        } else if (normalized['is_active'] !== undefined && normalized['is_active'] !== null) {
            const raw = String(normalized['is_active']).trim().toLowerCase()
            normalized['is_active'] = raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on' ? 1 : 0
        }
        if (normalized['content_plain'] === undefined || normalized['content_plain'] === null) {
            const plainSource = String(normalized['content'] ?? '')
            normalized['content_plain'] = plainSource.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        }
        if (normalized['thumbnail_gen'] === undefined || normalized['thumbnail_gen'] === null) {
            normalized['thumbnail_gen'] = normalized['thumbnail'] ? 'N' : ''
        }
        if (normalized['intro_video_gen'] === undefined || normalized['intro_video_gen'] === null) {
            normalized['intro_video_gen'] = normalized['intro_video'] ? 'N' : ''
        }
        if (normalized['attachment_gen'] === undefined || normalized['attachment_gen'] === null) {
            normalized['attachment_gen'] = normalized['attachment'] ? 'N' : ''
        }

        return normalized
    }

    private async loadDraftCollections(parentId: string, objRev: number): Promise<{
        childCollectionRows: Record<string, Array<Record<string, any>>>
        galleryCollectionRows: Record<string, Array<Record<string, any>>>
    }> {
        const childCollectionRows: Record<string, Array<Record<string, any>>> = {}
        const galleryCollectionRows: Record<string, Array<Record<string, any>>> = {}

        {
            const rows = await this.demo_jp_childDraftRepository.find({ where: { objParentId: parentId, objRev } as any })
            childCollectionRows['demo_jp_child'] = rows.map((row) => {
                const raw = row as unknown as Record<string, any>
                const {
                    demoJpChildId,
                    objParentId,
                    objStatus,
                    objState,
                    objLang,
                    objRev,
                    objContentId,
                    objCreatedDate,
                    objCreatedBy,
                    objModifiedDate,
                    objModifiedBy,
                    objPublishedDate,
                    objPublishedBy,
                    ...rest
                } = raw
                return rest
            })
        }
        {
            const rows = await this.demo_jp_galleryDraftRepository.find({ where: { objParentId: parentId, objRev } as any, order: { objPriority: 'ASC' } as any })
            galleryCollectionRows['demo_jp_gallery'] = rows.map((row) => ({
                file: (row as any).objFile,
                file_gen: (row as any).objFileGen,
                priority: (row as any).objPriority,
            }))
        }
        {
            const rows = await this.korea_galleryDraftRepository.find({ where: { objParentId: parentId, objRev } as any, order: { objPriority: 'ASC' } as any })
            galleryCollectionRows['korea_gallery'] = rows.map((row) => ({
                file: (row as any).objFile,
                file_gen: (row as any).objFileGen,
                priority: (row as any).objPriority,
            }))
        }

        return { childCollectionRows, galleryCollectionRows }
    }

    private attachCollectionsToDraft(
        draft: DemoJpTestDraft,
        childCollectionRows: Record<string, Array<Record<string, any>>>,
        galleryCollectionRows: Record<string, Array<Record<string, any>>>,
    ): DemoJpTestDraft & Record<string, any> {
        const hydrated: Record<string, any> = { ...draft }

        hydrated['__child_demo_jp_child'] = childCollectionRows['demo_jp_child'] || []
        hydrated['demo_jp_child'] = childCollectionRows['demo_jp_child'] || []
    hydrated['demo_jp_child_list'] = childCollectionRows['demo_jp_child'] || []
    hydrated['child_list'] = childCollectionRows['demo_jp_child'] || []
        hydrated['__gallery_demo_jp_gallery'] = (galleryCollectionRows['demo_jp_gallery'] || []).map((row) => ({
            file: String((row as any).file || ''),
            file_gen: String((row as any).file_gen || ''),
            type: String((row as any).type || 'image'),
            priority: Number((row as any).priority ?? 0) || 0,
        }))
        hydrated['demo_jp_gallery'] = hydrated['__gallery_demo_jp_gallery']
    hydrated['gallery'] = hydrated['__gallery_demo_jp_gallery']
        hydrated['__gallery_korea_gallery'] = (galleryCollectionRows['korea_gallery'] || []).map((row) => ({
            file: String((row as any).file || ''),
            file_gen: String((row as any).file_gen || ''),
            type: String((row as any).type || 'image'),
            priority: Number((row as any).priority ?? 0) || 0,
        }))
        hydrated['korea_gallery'] = hydrated['__gallery_korea_gallery']

        return hydrated as DemoJpTestDraft & Record<string, any>
    }

    private async replaceDraftCollections(parentId: string, draft: DemoJpTestDraft, childCollectionRows: Record<string, Array<Record<string, any>>>, galleryCollectionRows: Record<string, Array<Record<string, any>>>): Promise<void> {
        await this.demo_jp_childDraftRepository.delete({ objParentId: parentId, objRev: draft.objRev } as any)

        {
            const rows = childCollectionRows['demo_jp_child'] || []
            if (rows.length > 0) {
                const entities = rows.map((row) => this.demo_jp_childDraftRepository.create({
                    ...row,
                    demoJpChildId: OMUtilts.generateTimestampId(),
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
                } as any))
                await this.demo_jp_childDraftRepository.save(entities as any)
            }
        }
        await this.demo_jp_galleryDraftRepository.delete({ objParentId: parentId, objRev: draft.objRev } as any)

        {
            const rows = galleryCollectionRows['demo_jp_gallery'] || []
            if (rows.length > 0) {
                const entities = rows.map((row, index) => this.demo_jp_galleryDraftRepository.create({
                    demoJpGalleryId: OMUtilts.generateTimestampId(),
                    objParentId: parentId,
                    objFile: String((row as any).file || (row as any).obj_file || '').trim(),
                    objFileGen: String((row as any).file_gen || (row as any).obj_file_gen || '').trim(),
                    objPriority: Number((row as any).priority ?? (row as any).obj_priority ?? index) || index,
                    objLang: draft.objLang,
                    objRev: draft.objRev,
                } as any))
                await this.demo_jp_galleryDraftRepository.save(entities as any)
            }
        }
        await this.korea_galleryDraftRepository.delete({ objParentId: parentId, objRev: draft.objRev } as any)

        {
            const rows = galleryCollectionRows['korea_gallery'] || []
            if (rows.length > 0) {
                const entities = rows.map((row, index) => this.korea_galleryDraftRepository.create({
                    koreaGalleryId: OMUtilts.generateTimestampId(),
                    objParentId: parentId,
                    objFile: String((row as any).file || (row as any).obj_file || '').trim(),
                    objFileGen: String((row as any).file_gen || (row as any).obj_file_gen || '').trim(),
                    objPriority: Number((row as any).priority ?? (row as any).obj_priority ?? index) || index,
                    objLang: draft.objLang,
                    objRev: draft.objRev,
                } as any))
                await this.korea_galleryDraftRepository.save(entities as any)
            }
        }
    }

    private async replacePublishedCollections(parentId: string, draft: DemoJpTestDraft, childCollectionRows: Record<string, Array<Record<string, any>>>, galleryCollectionRows: Record<string, Array<Record<string, any>>>): Promise<void> {
        await this.demo_jp_childRepository.delete({ objParentId: parentId } as any)

        {
            const rows = childCollectionRows['demo_jp_child'] || []
            if (rows.length > 0) {
                const entities = rows.map((row) => this.demo_jp_childRepository.create({
                    ...row,
                    demoJpChildId: OMUtilts.generateTimestampId(),
                    objParentId: parentId,
                    objLang: draft.objLang,
                    objContentId: draft.objContentId,
                    objCreatedBy: draft.objCreatedBy,
                    objPublishedDate: draft.objPublishedDate,
                    objPublishedBy: draft.objPublishedBy,
                } as any))
                await this.demo_jp_childRepository.save(entities as any)
            }
        }
        await this.demo_jp_galleryRepository.delete({ objParentId: parentId } as any)

        {
            const rows = galleryCollectionRows['demo_jp_gallery'] || []
            if (rows.length > 0) {
                const entities = rows.map((row, index) => this.demo_jp_galleryRepository.create({
                    demoJpGalleryId: OMUtilts.generateTimestampId(),
                    objParentId: parentId,
                    objFile: String((row as any).file || (row as any).obj_file || '').trim(),
                    objFileGen: String((row as any).file_gen || (row as any).obj_file_gen || '').trim(),
                    objPriority: Number((row as any).priority ?? (row as any).obj_priority ?? index) || index,
                } as any))
                await this.demo_jp_galleryRepository.save(entities as any)
            }
        }
        await this.korea_galleryRepository.delete({ objParentId: parentId } as any)

        {
            const rows = galleryCollectionRows['korea_gallery'] || []
            if (rows.length > 0) {
                const entities = rows.map((row, index) => this.korea_galleryRepository.create({
                    koreaGalleryId: OMUtilts.generateTimestampId(),
                    objParentId: parentId,
                    objFile: String((row as any).file || (row as any).obj_file || '').trim(),
                    objFileGen: String((row as any).file_gen || (row as any).obj_file_gen || '').trim(),
                    objPriority: Number((row as any).priority ?? (row as any).obj_priority ?? index) || index,
                } as any))
                await this.korea_galleryRepository.save(entities as any)
            }
        }
    }

    async create(createDto: CreateDemoJpTestDto): Promise<DemoJpTestDraft> {
        const { publish, obj_state, obj_status, obj_lang, obj_rev, obj_created_by, obj_modified_by, obj_published_by, ...rest } = createDto as any
        const { sanitizedRest, childCollectionRows, galleryCollectionRows } = this.extractCollections(rest as Record<string, any>)
        const newId = await this.nextId()
        const contentId = newId
        const nextRev = obj_rev ?? (await this.nextRevision(contentId))
        const publishFlag = this.shouldPublish(publish, obj_state)
        const nowUtc = OMDatetime.getUtcNow()

        const normalizedRest = this.normalizePayloadForSave(sanitizedRest)

        const draft = this.draftRepository.create({
            ...normalizedRest,
            demoJpTestId: newId,
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
        } as any) as unknown as DemoJpTestDraft

        const savedDraft: DemoJpTestDraft = await this.draftRepository.save(draft as DemoJpTestDraft)
        await this.replaceDraftCollections((savedDraft as any).demoJpTestId, savedDraft, childCollectionRows, galleryCollectionRows)

        if (publishFlag) {
            const published = this.mainRepository.create(savedDraft as unknown as DemoJpTest)
            await this.mainRepository.save(published)
            await this.replacePublishedCollections((savedDraft as any).demoJpTestId, savedDraft, childCollectionRows, galleryCollectionRows)
        }

        return savedDraft
    }

    async findAll(query?: ListQueryInput): Promise<DemoJpTestDraft[] | { items: DemoJpTestDraft[]; total: number; page: number; pageSize: number }> {
        if (!query || Object.keys(query).length === 0) {
            return this.draftRepository.find({ where: { objStatus: 'active' } as any, order: { objModifiedDate: 'DESC' } as any })
        }

        const { qb, normalized } = this.buildListQuery(query)
        qb.skip((normalized.page - 1) * normalized.pageSize)
        qb.take(normalized.pageSize)

        const [items, total] = await qb.getManyAndCount()
        return { items, total, page: normalized.page, pageSize: normalized.pageSize }
    }

    async findOne(id: string): Promise<DemoJpTestDraft | null> {
        const row = await this.draftRepository
            .createQueryBuilder('d')
            .where('d.objStatus = :status', { status: 'active' })
            .andWhere('(d.demoJpTestId = :id OR d.objContentId = :id)', { id })
            .orderBy('d.objRev', 'DESC')
            .getOne()

        if (!row) return null
        const { childCollectionRows, galleryCollectionRows } = await this.loadDraftCollections(
            String((row as any).demoJpTestId),
            Number((row as any).objRev),
        )
        return this.attachCollectionsToDraft(row, childCollectionRows, galleryCollectionRows)
    }

    async update(id: string, updateDto: UpdateDemoJpTestDto): Promise<DemoJpTestDraft | null> {
        const existing = await this.findOne(id)
        if (!existing) return null

        const { publish, obj_state, obj_lang, obj_modified_by, obj_published_by, ...rest } = updateDto as any
        const { sanitizedRest, childCollectionRows, galleryCollectionRows, childCollectionProvided, galleryCollectionProvided } = this.extractCollections(rest as Record<string, any>)

        await this.draftRepository.update(
            { demoJpTestId: (existing as any).demoJpTestId, objLang: existing.objLang, objRev: existing.objRev } as any,
            { objStatus: 'archive', objModifiedBy: obj_modified_by ?? (existing as any).objModifiedBy, objModifiedDate: OMDatetime.getUtcNow() } as any,
        )

        const contentId = String((existing as any).objContentId)
        const nextRev = await this.nextRevision(contentId)
        const publishFlag = this.shouldPublish(publish, obj_state)
        const nowUtc = OMDatetime.getUtcNow()

        const normalizedRest = this.normalizePayloadForSave(sanitizedRest)

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
        } as any) as unknown as DemoJpTestDraft

        const savedDraft: DemoJpTestDraft = await this.draftRepository.save(merged as DemoJpTestDraft)

        const hasChildPayload = Object.values(childCollectionProvided).some(Boolean)
        const hasGalleryPayload = Object.values(galleryCollectionProvided).some(Boolean)

        const loadedPrevious = (!hasChildPayload && !hasGalleryPayload)
            ? await this.loadDraftCollections(String((existing as any).demoJpTestId), Number((existing as any).objRev))
            : { childCollectionRows: {}, galleryCollectionRows: {} }

        const resolvedChildCollectionRows = hasChildPayload
            ? childCollectionRows
            : (loadedPrevious.childCollectionRows || {})

        const resolvedGalleryCollectionRows = hasGalleryPayload
            ? galleryCollectionRows
            : (loadedPrevious.galleryCollectionRows || {})

        await this.replaceDraftCollections(String((savedDraft as any).demoJpTestId), savedDraft, resolvedChildCollectionRows, resolvedGalleryCollectionRows)

        if (publishFlag) {
            await this.mainRepository.save(this.mainRepository.create(savedDraft as unknown as DemoJpTest))
            await this.replacePublishedCollections(String((savedDraft as any).demoJpTestId), savedDraft, resolvedChildCollectionRows, resolvedGalleryCollectionRows)
        } else {
            await this.demo_jp_childRepository.delete({ objParentId: String((savedDraft as any).demoJpTestId) } as any)
            await this.demo_jp_galleryRepository.delete({ objParentId: String((savedDraft as any).demoJpTestId) } as any)
            await this.korea_galleryRepository.delete({ objParentId: String((savedDraft as any).demoJpTestId) } as any)
            await this.mainRepository.delete({ demoJpTestId: (savedDraft as any).demoJpTestId } as any)
        }

        return savedDraft
    }

    async remove(id: string, actorId?: number): Promise<void> {
        const existing = await this.findOne(id)
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

            await this.demo_jp_childRepository.delete({ objParentId: String((existing as any).demoJpTestId) } as any)
            await this.demo_jp_galleryRepository.delete({ objParentId: String((existing as any).demoJpTestId) } as any)
            await this.korea_galleryRepository.delete({ objParentId: String((existing as any).demoJpTestId) } as any)
        await this.mainRepository.delete({ demoJpTestId: (existing as any).demoJpTestId } as any)
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
            .filter((item): item is { field: string; column: keyof DemoJpTestDraft } => Boolean(item.column))

        const fallbackFields = ['demo_jp_test_id', 'obj_state', 'obj_lang', 'obj_modified_date']
        const pairs = selectedPairs.length > 0
            ? selectedPairs
            : fallbackFields
                    .map((field) => ({ field, column: this.resolveColumn(field) }))
                    .filter((item): item is { field: string; column: keyof DemoJpTestDraft } => Boolean(item.column))

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
            category: [
                { value: 'news', label: 'News' },
                { value: 'article', label: 'Article' },
                { value: 'blog', label: 'Blog' },
            ],
            status: [
                { value: 'draft', label: 'Draft' },
                { value: 'published', label: 'Published' },
                { value: 'archived', label: 'Archived' },
            ],
            flags: [
                { value: 'featured', label: 'Featured' },
                { value: 'recommended', label: 'Recommended' },
                { value: 'popular', label: 'Popular' },
            ],
            is_active: [
                { value: '1', label: 'Active' },
                { value: '0', label: 'Inactive' },
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

    async getRevisions(id: string): Promise<{ activeRevision: number | null; items: Array<Record<string, any>> }> {
        const current = await this.findOne(id)
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
            id: (row as any).demoJpTestId,
            contentId: (row as any).objContentId,
            rev: (row as any).objRev,
            lang: (row as any).objLang,
            state: (row as any).objState,
            status: (row as any).objStatus,
            modifiedDate: (row as any).objModifiedDate,
            modifiedBy: (row as any).objModifiedBy,
            publishedDate: (row as any).objPublishedDate,
            publishedBy: (row as any).objPublishedBy,
        }))

        return {
            activeRevision: current ? Number((current as any).objRev || 0) : null,
            items,
        }
    }

    async getRevisionSnapshot(id: string, rev: number, lang?: string): Promise<DemoJpTestDraft | null> {
        const normalizedRev = Number(rev) || 0
        if (normalizedRev <= 0) return null

        const current = await this.findOne(id)
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
            String((row as any).demoJpTestId),
            Number((row as any).objRev),
        )

        return this.attachCollectionsToDraft(row, childCollectionRows, galleryCollectionRows)
    }
}
