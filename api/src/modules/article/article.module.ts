import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { Article } from './article.entity';
import { ArticleDraft } from './article-draft.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Article,
      ArticleDraft,
    ]),
  ],
  controllers: [ArticleController],
  providers: [ArticleService],
})
export class ArticleModule {}
