import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DemoJp } from './demo_jp.entity'
import { DemoJpDraft } from './demo_jp-draft.entity'
import { DemoJpChild } from './demo_jp-child.entity'
import { DemoJpChildDraft } from './demo_jp-child-draft.entity'
import { DemoJpGallery } from './demo_jp-gallery.entity'
import { DemoJpGalleryDraft } from './demo_jp-gallery-draft.entity'
import { KoreaGallery } from './korea-gallery.entity'
import { KoreaGalleryDraft } from './korea-gallery-draft.entity'
import { DemoJpController } from './demo_jp.controller'
import { DemoJpService } from './demo_jp.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DemoJp,
      DemoJpDraft,
      DemoJpChild,
      DemoJpChildDraft,
      DemoJpGallery,
      DemoJpGalleryDraft,
      KoreaGallery,
      KoreaGalleryDraft,
    ]),
  ],
  controllers: [DemoJpController],
  providers: [DemoJpService],
})
export class DemoJpModule {}
