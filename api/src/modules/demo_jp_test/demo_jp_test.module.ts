import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DemoJpTestController } from './demo_jp_test.controller';
import { DemoJpTestService } from './demo_jp_test.service';
import { DemoJpTest } from './demo_jp_test.entity';
import { DemoJpTestDraft } from './demo_jp_test-draft.entity';
import { DemoJpChild } from './demo_jp_child.entity';
import { DemoJpChildDraft } from './demo_jp_child-draft.entity';
import { DemoJpGallery } from './demo_jp_gallery.entity';
import { DemoJpGalleryDraft } from './demo_jp_gallery-draft.entity';
import { KoreaGallery } from './korea_gallery.entity';
import { KoreaGalleryDraft } from './korea_gallery-draft.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DemoJpTest,
      DemoJpTestDraft,
      DemoJpChild,
      DemoJpChildDraft,
      DemoJpGallery,
      DemoJpGalleryDraft,
      KoreaGallery,
      KoreaGalleryDraft,
    ]),
  ],
  controllers: [DemoJpTestController],
  providers: [DemoJpTestService],
})
export class DemoJpTestModule {}
