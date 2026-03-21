import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';
import { DatabaseModule } from './common/database/database.module';
import { UploadsModule } from './common/uploads/uploads.module';
import { ArticleModule } from './modules/article/article.module';
import { WcmAuthModule } from './modules/wcm-auth/wcm-auth.module';
import { WcmUserModule } from './modules/wcm-user/wcm-user.module';
import { WcmRoleModule } from './modules/wcm-role/wcm-role.module';
import { WcmPermissionModule } from './modules/wcm-permission/wcm-permission.module';
import { HomeBannerModule } from './modules/home_banner/home_banner.module';
import { DemoJpModule } from './modules/demo_jp/demo_jp.module';
import { DemoJpTestModule } from './modules/demo_jp_test/demo_jp_test.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WcmSiteSettingModule } from './modules/wcm-site-setting/wcm-site-setting.module';
import { PrototypeModule } from './modules/prototype/prototype.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, '..', 'public'),
      serveRoot: '/',
    }),
    DatabaseModule,
    UploadsModule,
    WcmAuthModule,
    WcmUserModule,
    WcmRoleModule,
    WcmPermissionModule,
    ArticleModule,
    HomeBannerModule,
    DemoJpModule,
    WcmSiteSettingModule,
    PrototypeModule,
      DemoJpTestModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
