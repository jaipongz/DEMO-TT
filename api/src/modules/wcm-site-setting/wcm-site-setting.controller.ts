import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../wcm-auth/guards/jwt-auth.guard';
import { WcmSiteSettingService, SiteSettings } from './wcm-site-setting.service';

@ApiTags('site-settings')
@Controller('site-settings')
export class WcmSiteSettingController {
  constructor(private readonly siteSettingService: WcmSiteSettingService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get site settings' })
  @ApiResponse({ status: 200, description: 'Site settings' })
  async getSettings(): Promise<SiteSettings> {
    return this.siteSettingService.getSettings();
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update site settings' })
  @ApiResponse({ status: 200, description: 'Updated site settings' })
  async updateSettings(@Body() payload: Partial<SiteSettings>): Promise<SiteSettings> {
    return this.siteSettingService.saveSettings(payload);
  }
}
