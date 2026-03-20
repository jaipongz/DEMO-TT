import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleDraft } from './article-draft.entity';
import { JwtAuthGuard } from '../wcm-auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../wcm-auth/guards/permission.guard';
import { Permissions } from '../wcm-auth/decorators/permissions.decorator';

@ApiTags('articles')
@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  private resolveActorId(request: any): number {
    const raw = request?.user?.id
    const parsed = Number(raw)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 0
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('article.create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new article' })
  @ApiResponse({ status: 201, description: 'Article created successfully', type: ArticleDraft })
  async create(@Body() createArticleDto: CreateArticleDto, @Req() req: any): Promise<ArticleDraft> {
    const actorId = this.resolveActorId(req)
    createArticleDto.obj_created_by = actorId
    createArticleDto.obj_modified_by = actorId
    if (createArticleDto.publish || String(createArticleDto.obj_state || '').toLowerCase() === 'published') {
      createArticleDto.obj_published_by = actorId
    }
    return this.articleService.create(createArticleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all articles' })
  @ApiResponse({ status: 200, description: 'List of all articles', type: [ArticleDraft] })
  async findAll(): Promise<ArticleDraft[]> {
    return this.articleService.findAll();
  }

  @Post('lookup')
  @ApiOperation({ summary: 'Get article lookup options by field' })
  @ApiResponse({ status: 200, description: 'Article lookup options' })
  async lookup(@Body() body: { field?: string; lang?: string }) {
    return this.articleService.getLookup(body?.field, body?.lang);
  }

  @Get(':id/revisions')
  @ApiOperation({ summary: 'Get article revision history' })
  @ApiResponse({ status: 200, description: 'Article revision history' })
  async revisions(@Param('id') id: string) {
    return this.articleService.getRevisions(id)
  }

  @Get(':id/revisions/:rev')
  @ApiOperation({ summary: 'Get article revision snapshot' })
  @ApiResponse({ status: 200, description: 'Article revision snapshot' })
  async revisionSnapshot(@Param('id') id: string, @Param('rev') rev: string, @Req() req: any) {
    const lang = String(req?.query?.lang || '')
    return this.articleService.getRevisionSnapshot(id, Number(rev) || 0, lang)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get article by ID' })
  @ApiResponse({ status: 200, description: 'Article found', type: ArticleDraft })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async findOne(@Param('id') id: string): Promise<ArticleDraft | null> {
    return this.articleService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('article.update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update article' })
  @ApiResponse({ status: 200, description: 'Article updated successfully', type: ArticleDraft })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async update(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
    @Req() req: any,
  ): Promise<ArticleDraft | null> {
    const actorId = this.resolveActorId(req)
    updateArticleDto.obj_modified_by = actorId
    if (updateArticleDto.publish || String(updateArticleDto.obj_state || '').toLowerCase() === 'published') {
      updateArticleDto.obj_published_by = actorId
    }
    return this.articleService.update(id, updateArticleDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('article.delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete article' })
  @ApiResponse({ status: 200, description: 'Article deleted successfully' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async remove(@Param('id') id: string, @Req() req: any): Promise<void> {
    const actorId = this.resolveActorId(req)
    return this.articleService.remove(id, actorId);
  }
}
