import { Module } from '@nestjs/common';
import { WcmSiteSettingController } from './wcm-site-setting.controller';
import { WcmSiteSettingService } from './wcm-site-setting.service';

@Module({
  controllers: [WcmSiteSettingController],
  providers: [WcmSiteSettingService],
})
export class WcmSiteSettingModule {}
