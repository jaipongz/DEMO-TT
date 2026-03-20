import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm'

@Entity('korea_gallery')
export class KoreaGallery {
  @PrimaryColumn({ type: 'bigint', name: 'korea_gallery_id' })
  koreaGalleryId: string

  @Column('bigint', { name: 'obj_parent_id' })
  objParentId: string

  @Column('varchar', { name: 'obj_file', length: 255 })
  objFile: string

  @Column('varchar', { name: 'obj_file_gen', length: 10 })
  objFileGen: string

  @Column('int', { name: 'obj_priority', default: 0 })
  objPriority: number

  @Column('varchar', { name: 'obj_lang', length: 10, default: 'en' })
  objLang: string

  @CreateDateColumn({ name: 'obj_created_date' })
  objCreatedDate: Date

  @Column('int', { name: 'obj_created_by' })
  objCreatedBy: number
}
