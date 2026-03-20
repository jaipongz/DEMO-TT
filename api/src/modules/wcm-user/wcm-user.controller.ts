import { Controller, Get, Post, Body, Put, Param, Delete, ParseIntPipe, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WcmUserService } from './wcm-user.service';
import { CreateWcmUserDto } from './dto/create-wcm-user.dto';
import { UpdateWcmUserDto } from './dto/update-wcm-user.dto';
import { WcmUser } from './wcm-user.entity';
import { JwtAuthGuard } from '../wcm-auth/guards/jwt-auth.guard';

@ApiTags('wcm-users')
@Controller('wcm-users')
export class WcmUserController {
  constructor(private readonly cmsUserService: WcmUserService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new CMS user' })
  @ApiResponse({ status: 201, description: 'User created successfully', type: WcmUser })
  async create(@Body() createCmsUserDto: CreateWcmUserDto): Promise<WcmUser> {
    return this.cmsUserService.create(createCmsUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all CMS users' })
  @ApiResponse({ status: 200, description: 'List of all users', type: [WcmUser] })
  async findAll(): Promise<WcmUser[]> {
    return this.cmsUserService.findAll();
  }

  @Post('lookup')
  @ApiOperation({ summary: 'Get CMS user lookup options by field' })
  @ApiResponse({ status: 200, description: 'CMS user lookup options' })
  async lookup(@Body() body: { field?: string; lang?: string }) {
    return this.cmsUserService.getLookup(body?.field, body?.lang);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found', type: WcmUser })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<WcmUser | null> {
    return this.cmsUserService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully', type: WcmUser })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCmsUserDto: UpdateWcmUserDto,
  ): Promise<WcmUser | null> {
    return this.cmsUserService.update(id, updateCmsUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.cmsUserService.remove(id);
  }

  @Post(':id/reset-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reset CMS user password' })
  @ApiResponse({ status: 200, description: 'Password reset successfully', type: WcmUser })
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { password?: string },
  ): Promise<WcmUser | null> {
    const password = String(body?.password || '').trim();
    if (password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    return this.cmsUserService.resetPassword(id, password);
  }
}
