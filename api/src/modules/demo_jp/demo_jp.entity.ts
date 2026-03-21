import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm'

@Entity('demo_jp')
export class DemoJp {
  @PrimaryColumn({ type: 'bigint', name: 'demo_jp_id' })
  demoJpId: string

  @Column('varchar', { name: 'title', length: 255 })
  title: string

  @Column('varchar', { name: 'email', length: 255, nullable: true })
  email?: string | null

  @Column('int', { name: 'age', nullable: true })
  age?: number | null

  @Column('varchar', { name: 'brand_color', length: 20, nullable: true })
  brandColor?: string | null

  @Column('varchar', { name: 'category', length: 50, nullable: true })
  category?: string | null

  @Column('varchar', { name: 'province', length: 255, nullable: true })
  province?: string | null

  @Column('varchar', { name: 'article', length: 255, nullable: true })
  article?: string | null

  @Column('mediumtext', { name: 'home_banner_tags', nullable: true })
  homeBannerTags?: string | null

  @Column('varchar', { name: 'status', length: 50, nullable: true })
  status?: string | null

  @Column('text', { name: 'flags', nullable: true })
  flagsJson?: string | null

  @Column('tinyint', { name: 'is_active', default: 0 })
  isActive: number

  @Column('date', { name: 'published_date', nullable: true })
  publishedDate?: string | null

  @Column('datetime', { name: 'published_at', nullable: true })
  publishedAt?: Date | null

  @Column('text', { name: 'summary', nullable: true })
  summary?: string | null

  @Column('text', { name: 'content', nullable: true })
  contentHtml?: string | null

  @Column('text', { name: 'content_plain', nullable: true })
  contentPlain?: string | null

  @Column('varchar', { name: 'thumbnail', length: 255, nullable: true })
  thumbnail?: string | null

  @Column('varchar', { name: 'thumbnail_gen', length: 10, nullable: true })
  thumbnailGen?: string | null

  @Column('varchar', { name: 'thumbnail_alt', length: 255, nullable: true })
  thumbnailAlt?: string | null

  @Column('varchar', { name: 'intro_video', length: 255, nullable: true })
  introVideo?: string | null

  @Column('varchar', { name: 'intro_video_gen', length: 10, nullable: true })
  introVideoGen?: string | null

  @Column('varchar', { name: 'attachment', length: 255, nullable: true })
  attachment?: string | null

  @Column('varchar', { name: 'attachment_gen', length: 10, nullable: true })
  attachmentGen?: string | null

  @Column('varchar', { name: 'obj_lang', length: 10 })
  objLang: string

  @Column('bigint', { name: 'obj_content_id' })
  objContentId: string

  @CreateDateColumn({ name: 'obj_created_date' })
  objCreatedDate: Date

  @Column('int', { name: 'obj_created_by' })
  objCreatedBy: number

  @Column('datetime', { name: 'obj_published_date', nullable: true, default: () => 'NULL' })
  objPublishedDate: Date | null

  @Column('int', { name: 'obj_published_by', nullable: true })
  objPublishedBy: number | null
}
