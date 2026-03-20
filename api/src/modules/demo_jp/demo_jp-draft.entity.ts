import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('demo_jp_draft')
export class DemoJpDraft {
  @PrimaryColumn({ type: 'bigint', name: 'demo_jp_id' })
  demoJpId: string;

  @Column('varchar', { name: 'title' })
  title: string;

  @Column('varchar', { name: 'email', nullable: true })
  email?: string;

  @Column('int', { name: 'age', nullable: true })
  age?: number;

  @Column('varchar', { name: 'brand_color', nullable: true })
  brandColor?: string;

  @Column('date', { name: 'published_date', nullable: true })
  publishedDate?: string;

  @Column('datetime', { name: 'published_at', nullable: true })
  publishedAt?: string;

  @Column('varchar', { name: 'category' })
  category: string;

  @Column('varchar', { name: 'province' })
  province: string;

  @Column('varchar', { name: 'article', nullable: true })
  article?: string;

  @Column('varchar', { name: 'home_banner_tags', nullable: true })
  homeBannerTags?: string;

  @Column('varchar', { name: 'status', nullable: true })
  status?: string;

  @Column('varchar', { name: 'flags', nullable: true })
  flags?: string;

  @Column('tinyint', { name: 'is_active', nullable: true })
  isActive?: number;

  @Column('text', { name: 'summary', nullable: true })
  summary?: string;

  @Column('text', { name: 'content', nullable: true })
  content?: string;

  @Column('varchar', { name: 'thumbnail', nullable: true })
  thumbnail?: string;

  @Column('varchar', { name: 'intro_video', nullable: true })
  introVideo?: string;

  @Column('varchar', { name: 'attachment', nullable: true })
  attachment?: string;

  @Column('varchar', { name: 'obj_status', length: 10 })
  objStatus: string;

  @Column('varchar', { name: 'obj_state', length: 10 })
  objState: string;

  @PrimaryColumn({ type: 'varchar', name: 'obj_lang', length: 10 })
  objLang: string;

  @PrimaryColumn({ type: 'int', name: 'obj_rev' })
  objRev: number;

  @Column('bigint', { name: 'obj_content_id' })
  objContentId: string;

  @CreateDateColumn({ name: 'obj_created_date' })
  objCreatedDate: Date;

  @Column('int', { name: 'obj_created_by' })
  objCreatedBy: number;

  @UpdateDateColumn({ name: 'obj_modified_date' })
  objModifiedDate: Date;

  @Column('int', { name: 'obj_modified_by' })
  objModifiedBy: number;

  @Column('datetime', { name: 'obj_published_date', nullable: true, default: () => 'NULL' })
  objPublishedDate: Date | null;

  @Column('int', { name: 'obj_published_by', nullable: true })
  objPublishedBy: number | null;
}
