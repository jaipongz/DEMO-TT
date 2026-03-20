import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../wcm-auth/guards/jwt-auth.guard';
import { DemoJpTestService } from './demo_jp_test.service';
import { CreateDemoJpTestDto } from './dto/create-demo_jp_test.dto';
import { UpdateDemoJpTestDto } from './dto/update-demo_jp_test.dto';
import { DemoJpTestDraft } from './demo_jp_test-draft.entity';

@ApiTags('demo_jp_test')
@Controller('demo_jp_test')
export class DemoJpTestController {
  constructor(private readonly _service: DemoJpTestService) {}

  private resolveActorId(request: any): number {
    const raw = request?.user?.id;
    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create demo_jp_test record' })
  @ApiResponse({ status: 201, description: 'Created successfully', type: DemoJpTestDraft })
  async create(@Body() data: CreateDemoJpTestDto, @Req() req: any) {
    const actorId = this.resolveActorId(req);
    data.obj_created_by = actorId;
    data.obj_modified_by = actorId;
    if (data.publish || String(data.obj_state || '').toLowerCase() === 'published') {
      data.obj_published_by = actorId;
    }
    return this._service.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all demo_jp_test records' })
  @ApiResponse({ status: 200, description: 'List of records', type: [DemoJpTestDraft] })
  findAll(@Query() query: Record<string, string | string[] | undefined>) {
    return this._service.findAll(query);
  }

  @Post('lookup')
  @ApiOperation({ summary: 'Get lookup options by field' })
  @ApiResponse({ status: 200, description: 'Lookup options' })
  lookup(@Body() body: { field?: string; lang?: string }) {
    return this._service.getLookup(body?.field, body?.lang);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get demo_jp_test by ID or content ID' })
  @ApiResponse({ status: 200, description: 'Found record', type: DemoJpTestDraft })
  findOne(@Param('id') id: string) {
    return this._service.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update demo_jp_test record' })
  @ApiResponse({ status: 200, description: 'Updated record', type: DemoJpTestDraft })
  async update(@Param('id') id: string, @Body() data: UpdateDemoJpTestDto, @Req() req: any) {
    const actorId = this.resolveActorId(req);
    data.obj_modified_by = actorId;
    if (data.publish || String(data.obj_state || '').toLowerCase() === 'published') {
      data.obj_published_by = actorId;
    }
    return this._service.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete demo_jp_test record' })
  @ApiResponse({ status: 200, description: 'Deleted successfully' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const actorId = this.resolveActorId(req);
    return this._service.remove(id, actorId);
  }

  @Post('export')
  @ApiOperation({ summary: 'Export demo_jp_test records with selected fields' })
  @ApiResponse({ status: 200, description: 'Export payload with selected fields and rows' })
  export(@Body() body: any) {
    return this._service.exportRows(body);
  }
}
