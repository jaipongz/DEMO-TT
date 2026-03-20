import { Controller, Get, Post, Body, Put, Param, Delete, Req, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { HomeBannerService } from './home_banner.service'
import { CreateHomeBannerDto } from './dto/create-home_banner.dto'
import { UpdateHomeBannerDto } from './dto/update-home_banner.dto'
import { HomeBannerDraft } from './home_banner-draft.entity'
import { JwtAuthGuard } from '../wcm-auth/guards/jwt-auth.guard'

@ApiTags('home_banner')
@Controller('home_banner')
export class HomeBannerController {
  constructor(private readonly homeBannerService: HomeBannerService) {}

  private resolveActorId(request: any): number {
    const raw = request?.user?.id
    const parsed = Number(raw)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 0
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new home banner' })
  @ApiResponse({ status: 201, description: 'Home banner created successfully', type: HomeBannerDraft })
  async create(@Body() createDto: CreateHomeBannerDto, @Req() req: any): Promise<HomeBannerDraft> {
    const actorId = this.resolveActorId(req)
    createDto.obj_created_by = actorId
    createDto.obj_modified_by = actorId
    if (createDto.publish || String(createDto.obj_state || '').toLowerCase() === 'published') {
      createDto.obj_published_by = actorId
    }
    return this.homeBannerService.create(createDto)
  }

  @Get()
  @ApiOperation({ summary: 'Get all home banners' })
  @ApiResponse({ status: 200, description: 'List of home banners', type: [HomeBannerDraft] })
  async findAll(): Promise<HomeBannerDraft[]> {
    return this.homeBannerService.findAll()
  }

  @Post('lookup')
  @ApiOperation({ summary: 'Get home banner lookup options by field' })
  @ApiResponse({ status: 200, description: 'Home banner lookup options' })
  async lookup(@Body() body: { field?: string; lang?: string }) {
    return this.homeBannerService.getLookup(body?.field, body?.lang)
  }

  @Get(':id/revisions')
  @ApiOperation({ summary: 'Get home banner revision history' })
  @ApiResponse({ status: 200, description: 'Home banner revision history' })
  async revisions(@Param('id') id: string) {
    return this.homeBannerService.getRevisions(id)
  }

  @Get(':id/revisions/:rev')
  @ApiOperation({ summary: 'Get home banner revision snapshot' })
  @ApiResponse({ status: 200, description: 'Home banner revision snapshot' })
  async revisionSnapshot(@Param('id') id: string, @Param('rev') rev: string, @Req() req: any) {
    const lang = String(req?.query?.lang || '')
    return this.homeBannerService.getRevisionSnapshot(id, Number(rev) || 0, lang)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get home banner by ID or content ID' })
  @ApiResponse({ status: 200, description: 'Home banner found', type: HomeBannerDraft })
  async findOne(@Param('id') id: string): Promise<HomeBannerDraft | null> {
    return this.homeBannerService.findOne(id)
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update home banner' })
  @ApiResponse({ status: 200, description: 'Home banner updated successfully', type: HomeBannerDraft })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateHomeBannerDto,
    @Req() req: any,
  ): Promise<HomeBannerDraft | null> {
    const actorId = this.resolveActorId(req)
    updateDto.obj_modified_by = actorId
    if (updateDto.publish || String(updateDto.obj_state || '').toLowerCase() === 'published') {
      updateDto.obj_published_by = actorId
    }
    return this.homeBannerService.update(id, updateDto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete home banner' })
  @ApiResponse({ status: 200, description: 'Home banner deleted successfully' })
  async remove(@Param('id') id: string, @Req() req: any): Promise<void> {
    const actorId = this.resolveActorId(req)
    return this.homeBannerService.remove(id, actorId)
  }
}
