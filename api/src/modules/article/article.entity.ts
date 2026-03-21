import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('article')
export class Article {
  @PrimaryColumn({ type: 'bigint', name: 'article_id' })
  articleId: string;

  @Column('varchar', { name: 'title' })
  title: string;

  @Column('text', { name: 'short_description', nullable: true })
  shortDescription?: string;

  @Column('varchar', { name: 'thumbnail', nullable: true })
  thumbnail?: string;
  @Column('varchar', { name: 'thumbnail_gen', length: 10, nullable: true })
  thumbnailGen?: string;
  @Column('varchar', { name: 'thumbnail_alt', nullable: true })
  thumbnailAlt?: string;

  @Column('varchar', { name: 'obj_lang', length: 10 })
  objLang: string;

  @Column('bigint', { name: 'obj_content_id' })
  objContentId: string;

  @CreateDateColumn({ name: 'obj_created_date' })
  objCreatedDate: Date;

  @Column('int', { name: 'obj_created_by' })
  objCreatedBy: number;

  @Column('datetime', { name: 'obj_published_date', nullable: true, default: () => 'NULL' })
  objPublishedDate: Date | null;

  @Column('int', { name: 'obj_published_by', nullable: true })
  objPublishedBy: number | null;
}
