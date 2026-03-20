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
import { DemoJpService } from './demo_jp.service';
import { CreateDemoJpDto } from './dto/create-demo_jp.dto';
import { UpdateDemoJpDto } from './dto/update-demo_jp.dto';
import { DemoJpDraft } from './demo_jp-draft.entity';

@ApiTags('demo_jp')
@Controller('demo_jp')
export class DemoJpController {
  constructor(private readonly _service: DemoJpService) {}

  private resolveActorId(request: any): number {
    const raw = request?.user?.id;
    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create demo_jp record' })
  @ApiResponse({ status: 201, description: 'Created successfully', type: DemoJpDraft })
  async create(@Body() data: CreateDemoJpDto, @Req() req: any) {
    const actorId = this.resolveActorId(req);
    data.obj_created_by = actorId;
    data.obj_modified_by = actorId;
    if (data.publish || String(data.obj_state || '').toLowerCase() === 'published') {
      data.obj_published_by = actorId;
    }
    return this._service.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all demo_jp records' })
  @ApiResponse({ status: 200, description: 'List of records', type: [DemoJpDraft] })
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
  @ApiOperation({ summary: 'Get demo_jp by ID or content ID' })
  @ApiResponse({ status: 200, description: 'Found record', type: DemoJpDraft })
  findOne(@Param('id') id: string) {
    return this._service.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update demo_jp record' })
  @ApiResponse({ status: 200, description: 'Updated record', type: DemoJpDraft })
  async update(@Param('id') id: string, @Body() data: UpdateDemoJpDto, @Req() req: any) {
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
  @ApiOperation({ summary: 'Delete demo_jp record' })
  @ApiResponse({ status: 200, description: 'Deleted successfully' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const actorId = this.resolveActorId(req);
    return this._service.remove(id, actorId);
  }

  @Post('export')
  @ApiOperation({ summary: 'Export demo_jp records with selected fields' })
  @ApiResponse({ status: 200, description: 'Export payload with selected fields and rows' })
  export(@Body() body: any) {
    return this._service.exportRows(body);
  }
}
