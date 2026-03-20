import { Controller, Get, Post, Body, Put, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WcmPermissionService } from './wcm-permission.service';
import { CreateWcmPermissionDto } from './dto/create-wcm-permission.dto';
import { UpdateWcmPermissionDto } from './dto/update-wcm-permission.dto';
import { WcmPermission } from './wcm-permission.entity';
import { JwtAuthGuard } from '../wcm-auth/guards/jwt-auth.guard';

@ApiTags('wcm-permissions')
@Controller('wcm-permissions')
export class WcmPermissionController {
  constructor(private readonly permissionService: WcmPermissionService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({ status: 201, description: 'Permission created successfully', type: WcmPermission })
  async create(@Body() createPermissionDto: CreateWcmPermissionDto): Promise<WcmPermission> {
    return this.permissionService.create(createPermissionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({ status: 200, description: 'List of all permissions', type: [WcmPermission] })
  async findAll(): Promise<WcmPermission[]> {
    return this.permissionService.findAll();
  }

  @Post('lookup')
  @ApiOperation({ summary: 'Get permission lookup options by field' })
  @ApiResponse({ status: 200, description: 'Permission lookup options' })
  async lookup(@Body() body: { field?: string; lang?: string }) {
    return this.permissionService.getLookup(body?.field, body?.lang);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get permission by ID' })
  @ApiResponse({ status: 200, description: 'Permission found', type: WcmPermission })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<WcmPermission | null> {
    return this.permissionService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update permission' })
  @ApiResponse({ status: 200, description: 'Permission updated successfully', type: WcmPermission })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePermissionDto: UpdateWcmPermissionDto,
  ): Promise<WcmPermission | null> {
    return this.permissionService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete permission' })
  @ApiResponse({ status: 200, description: 'Permission deleted successfully' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.permissionService.remove(id);
  }
}
