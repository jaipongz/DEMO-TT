import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('home_banner_draft')
export class HomeBannerDraft {
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

  @Column('varchar', { name: 'obj_status', length: 10, default: 'active' })
  objStatus: string

  @Column('varchar', { name: 'obj_state', length: 10, default: 'draft' })
  objState: string

  @PrimaryColumn({ type: 'varchar', name: 'obj_lang', length: 10, default: 'en' })
  objLang: string

  @PrimaryColumn({ type: 'int', name: 'obj_rev', default: 1 })
  objRev: number

  @Column('bigint', { name: 'obj_content_id' })
  objContentId: string

  @CreateDateColumn({ name: 'obj_created_date' })
  objCreatedDate: Date

  @Column('int', { name: 'obj_created_by' })
  objCreatedBy: number

  @UpdateDateColumn({ name: 'obj_modified_date' })
  objModifiedDate: Date

  @Column('int', { name: 'obj_modified_by' })
  objModifiedBy: number

  @Column('datetime', { name: 'obj_published_date', nullable: true, default: () => 'NULL' })
  objPublishedDate: Date | null

  @Column('int', { name: 'obj_published_by', nullable: true })
  objPublishedBy: number | null
}
