import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DemoJpController } from './demo_jp.controller';
import { DemoJpService } from './demo_jp.service';
import { DemoJp } from './demo_jp.entity';
import { DemoJpDraft } from './demo_jp-draft.entity';
import { DemoJpChild } from './demo_jp_child.entity';
import { DemoJpChildDraft } from './demo_jp_child-draft.entity';
import { DemoJpGallery } from './demo_jp_gallery.entity';
import { DemoJpGalleryDraft } from './demo_jp_gallery-draft.entity';
import { KoreaGallery } from './korea_gallery.entity';
import { KoreaGalleryDraft } from './korea_gallery-draft.entity';

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
