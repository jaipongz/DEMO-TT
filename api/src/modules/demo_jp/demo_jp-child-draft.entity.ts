import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

@Entity('demo_jp_child_draft')
export class DemoJpChildDraft {
  @PrimaryColumn({ type: 'bigint', name: 'demo_jp_child_id' })
  demoJpChildId: string

  @Column('varchar', { name: 'title', length: 255 })
  title: string

  @Column('varchar', { name: 'file', length: 255, nullable: true })
  file?: string | null

  @Column('varchar', { name: 'file_gen', length: 10, nullable: true })
  fileGen?: string | null

  @Column('text', { name: 'detail', nullable: true })
  detail?: string | null

  @Column('bigint', { name: 'obj_parent_id' })
  objParentId: string

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
