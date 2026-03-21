import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { ArticleService } from './article.service'
import { CreateArticleDto } from './dto/create-article.dto'
import { UpdateArticleDto } from './dto/update-article.dto'
import { ArticleDraft } from './article-draft.entity'
import { JwtAuthGuard } from '../wcm-auth/guards/jwt-auth.guard'

@ApiTags('article')
@Controller('article')
export class ArticleController {
  constructor(private readonly _service: ArticleService) {}

  private resolveActorId(request: any): number {
    const raw = request?.user?.id
    const parsed = Number(raw)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 0
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create article record' })
  @ApiResponse({ status: 201, description: 'Created successfully', type: ArticleDraft })
  async create(@Body() dto: CreateArticleDto, @Req() req: any): Promise<ArticleDraft> {
    const actorId = this.resolveActorId(req)
    dto.obj_created_by = actorId
    dto.obj_modified_by = actorId
    if (dto.publish || String(dto.obj_state || '').toLowerCase() === 'published') {
      dto.obj_published_by = actorId
    }
    return this._service.create(dto)
  }

  @Get()
  @ApiOperation({ summary: 'Get all article records' })
  @ApiResponse({ status: 200, description: 'List of records', type: [ArticleDraft] })
  async findAll(@Query() query: Record<string, string | string[] | undefined>): Promise<any> {
    return this._service.findAll(query)
  }

  @Post('export')
  @ApiOperation({ summary: 'Export article records with selected fields' })
  @ApiResponse({ status: 200, description: 'Export payload with selected fields and rows' })
  async export(@Body() body: Record<string, any>) {
    return this._service.exportRows(body)
  }

  @Post('lookup')
  @ApiOperation({ summary: 'Get lookup options by field' })
  @ApiResponse({ status: 200, description: 'Lookup options' })
  async lookup(@Body() body: { field?: string; lang?: string }) {
    return this._service.getLookup(body?.field, body?.lang)
  }

  @Post('actions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Run list action (setstatus/delete)' })
  @ApiResponse({ status: 200, description: 'List action result' })
  async runAction(@Body() body: { action?: string; ids?: Array<string | number>; state?: string }, @Req() req: any) {
    const actorId = this.resolveActorId(req)
    return this._service.runListAction(body, actorId)
  }

  @Get(':id/revisions')
  @ApiOperation({ summary: 'Get article revision history' })
  @ApiResponse({ status: 200, description: 'Article revision history' })
  async revisions(@Param('id') id: string) {
    return this._service.getRevisions(id)
  }

  @Get(':id/revisions/:rev')
  @ApiOperation({ summary: 'Get article revision snapshot' })
  @ApiResponse({ status: 200, description: 'Article revision snapshot' })
  async revisionSnapshot(@Param('id') id: string, @Param('rev') rev: string, @Req() req: any) {
    const lang = String(req?.query?.lang || '')
    return this._service.getRevisionSnapshot(id, Number(rev) || 0, lang)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get article by ID or content ID' })
  @ApiResponse({ status: 200, description: 'Found record', type: ArticleDraft })
  async findOne(@Param('id') id: string): Promise<ArticleDraft | null> {
    return this._service.findOne(id)
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update article record' })
  @ApiResponse({ status: 200, description: 'Updated record', type: ArticleDraft })
  async update(@Param('id') id: string, @Body() dto: UpdateArticleDto, @Req() req: any): Promise<ArticleDraft | null> {
    const actorId = this.resolveActorId(req)
    dto.obj_modified_by = actorId
    if (dto.publish || String(dto.obj_state || '').toLowerCase() === 'published') {
      dto.obj_published_by = actorId
    }
    return this._service.update(id, dto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete article record' })
  @ApiResponse({ status: 200, description: 'Deleted successfully' })
  async remove(@Param('id') id: string, @Req() req: any): Promise<void> {
    const actorId = this.resolveActorId(req)
    return this._service.remove(id, actorId)
  }
}
