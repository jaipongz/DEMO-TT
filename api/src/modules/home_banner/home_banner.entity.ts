import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm'

@Entity('home_banner')
export class HomeBanner {
  @PrimaryColumn({ type: 'bigint', name: 'home_banner_id' })
  homeBannerId: string

  @Column('varchar', { name: 'title', length: 255 })
  title: string

  @Column('varchar', { name: 'banner', length: 255, nullable: true })
  banner?: string | null

  @Column('varchar', { name: 'banner_gen', length: 10, nullable: true })
  bannerGen?: string | null

  @Column('varchar', { name: 'banner_alt', length: 255, nullable: true })
  bannerAlt?: string | null

  @Column('varchar', { name: 'banner_video', length: 255, nullable: true })
  bannerVideo?: string | null

  @Column('varchar', { name: 'banner_video_gen', length: 10, nullable: true })
  bannerVideoGen?: string | null

  @Column('varchar', { name: 'mode', length: 255 })
  mode: string

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
