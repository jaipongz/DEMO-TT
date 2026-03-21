import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { DemoJpTestService } from './demo_jp_test.service'
import { CreateDemoJpTestDto } from './dto/create-demo_jp_test.dto'
import { UpdateDemoJpTestDto } from './dto/update-demo_jp_test.dto'
import { DemoJpTestDraft } from './demo_jp_test-draft.entity'
import { JwtAuthGuard } from '../wcm-auth/guards/jwt-auth.guard'

@ApiTags('demo_jp_test')
@Controller('demo_jp_test')
export class DemoJpTestController {
  constructor(private readonly _service: DemoJpTestService) {}

  private resolveActorId(request: any): number {
    const raw = request?.user?.id
    const parsed = Number(raw)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 0
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create demo_jp_test record' })
  @ApiResponse({ status: 201, description: 'Created successfully', type: DemoJpTestDraft })
  async create(@Body() dto: CreateDemoJpTestDto, @Req() req: any): Promise<DemoJpTestDraft> {
    const actorId = this.resolveActorId(req)
    dto.obj_created_by = actorId
    dto.obj_modified_by = actorId
    if (dto.publish || String(dto.obj_state || '').toLowerCase() === 'published') {
      dto.obj_published_by = actorId
    }
    return this._service.create(dto)
  }

  @Get()
  @ApiOperation({ summary: 'Get all demo_jp_test records' })
  @ApiResponse({ status: 200, description: 'List of records', type: [DemoJpTestDraft] })
  async findAll(@Query() query: Record<string, string | string[] | undefined>): Promise<any> {
    return this._service.findAll(query)
  }

  @Post('export')
  @ApiOperation({ summary: 'Export demo_jp_test records with selected fields' })
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
  @ApiOperation({ summary: 'Get demo_jp_test revision history' })
  @ApiResponse({ status: 200, description: 'DemoJpTest revision history' })
  async revisions(@Param('id') id: string) {
    return this._service.getRevisions(id)
  }

  @Get(':id/revisions/:rev')
  @ApiOperation({ summary: 'Get demo_jp_test revision snapshot' })
  @ApiResponse({ status: 200, description: 'DemoJpTest revision snapshot' })
  async revisionSnapshot(@Param('id') id: string, @Param('rev') rev: string, @Req() req: any) {
    const lang = String(req?.query?.lang || '')
    return this._service.getRevisionSnapshot(id, Number(rev) || 0, lang)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get demo_jp_test by ID or content ID' })
  @ApiResponse({ status: 200, description: 'Found record', type: DemoJpTestDraft })
  async findOne(@Param('id') id: string): Promise<DemoJpTestDraft | null> {
    return this._service.findOne(id)
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update demo_jp_test record' })
  @ApiResponse({ status: 200, description: 'Updated record', type: DemoJpTestDraft })
  async update(@Param('id') id: string, @Body() dto: UpdateDemoJpTestDto, @Req() req: any): Promise<DemoJpTestDraft | null> {
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
  @ApiOperation({ summary: 'Delete demo_jp_test record' })
  @ApiResponse({ status: 200, description: 'Deleted successfully' })
  async remove(@Param('id') id: string, @Req() req: any): Promise<void> {
    const actorId = this.resolveActorId(req)
    return this._service.remove(id, actorId)
  }
}
