import { Controller, Get, Post, Body, Put, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WcmRoleService } from './wcm-role.service';
import { CreateWcmRoleDto } from './dto/create-wcm-role.dto';
import { UpdateWcmRoleDto } from './dto/update-wcm-role.dto';
import { WcmRole } from './wcm-role.entity';
import { JwtAuthGuard } from '../wcm-auth/guards/jwt-auth.guard';

@ApiTags('wcm-roles')
@Controller('wcm-roles')
export class WcmRoleController {
  constructor(private readonly roleService: WcmRoleService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created successfully', type: WcmRole })
  async create(@Body() createRoleDto: CreateWcmRoleDto): Promise<WcmRole> {
    return this.roleService.create(createRoleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'List of all roles', type: [WcmRole] })
  async findAll(): Promise<WcmRole[]> {
    return this.roleService.findAll();
  }

  @Post('lookup')
  @ApiOperation({ summary: 'Get role lookup options' })
  @ApiResponse({ status: 200, description: 'Role options' })
  async lookup(@Body() body: { field?: string; lang?: string }) {
    return this.roleService.getLookup(body?.field, body?.lang);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiResponse({ status: 200, description: 'Role found', type: WcmRole })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<WcmRole | null> {
    return this.roleService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update role' })
  @ApiResponse({ status: 200, description: 'Role updated successfully', type: WcmRole })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateWcmRoleDto,
  ): Promise<WcmRole | null> {
    return this.roleService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete role' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.roleService.remove(id);
  }
}
