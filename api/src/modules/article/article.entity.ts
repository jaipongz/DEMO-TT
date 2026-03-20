import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm'

@Entity('articles')
export class Article {
  @PrimaryColumn({ type: 'bigint', name: 'articles_id' })
  articlesId: string

  @Column('varchar', { name: 'thumbnail', length: 255 })
  thumbnail: string

  @Column('varchar', { name: 'thumbnail_gen', length: 10 })
  thumbnailGen: string

  @Column('varchar', { name: 'thumbnail_alt', length: 255, nullable: true })
  thumbnailAlt?: string | null

  @Column('varchar', { name: 'video', length: 255, nullable: true })
  video?: string | null

  @Column('varchar', { name: 'video_gen', length: 10, nullable: true })
  videoGen?: string | null

  @Column('varchar', { name: 'file', length: 255, nullable: true })
  file?: string | null

  @Column('varchar', { name: 'file_gen', length: 10, nullable: true })
  fileGen?: string | null

  @Column('varchar', { name: 'title', length: 500 })
  title: string

  @Column('varchar', { name: 'author', length: 255 })
  author: string

  @Column('varchar', { name: 'date', length: 255 })
  date: string

  @Column('mediumtext', { name: 'content' })
  content: string

  @Column('text', { name: 'content-wysiwyg' })
  contentWysiwyg: string

  @Column('text', { name: 'content-wysiwyg_plain' })
  contentWysiwygPlain: string

  @Column('varchar', { name: 'brandColor', length: 255, nullable: true })
  brandColor?: string | null

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
