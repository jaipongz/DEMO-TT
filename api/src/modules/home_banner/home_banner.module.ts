import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { HomeBanner } from './home_banner.entity'
import { HomeBannerDraft } from './home_banner-draft.entity'
import { HomeBannerDetail } from './home_banner-detail.entity'
import { HomeBannerDetailDraft } from './home_banner-detail-draft.entity'
import { HomeBannerGallery } from './home_banner-gallery.entity'
import { HomeBannerGalleryDraft } from './home_banner-gallery-draft.entity'
import { HomeBannerService } from './home_banner.service'
import { HomeBannerController } from './home_banner.controller'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HomeBanner,
      HomeBannerDraft,
      HomeBannerDetail,
      HomeBannerDetailDraft,
      HomeBannerGallery,
      HomeBannerGalleryDraft,
    ]),
  ],
  controllers: [HomeBannerController],
  providers: [HomeBannerService],
})
export class HomeBannerModule {}
