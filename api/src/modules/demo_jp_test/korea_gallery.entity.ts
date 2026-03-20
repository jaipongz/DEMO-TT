import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('korea_gallery')
export class KoreaGallery {
  @PrimaryColumn({ type: 'bigint', name: 'korea_gallery_id' })
  koreaGalleryId: string;

  @Column('bigint', { name: 'obj_parent_id' })
  objParentId: string;

  @Column('varchar', { name: 'obj_file', length: 255 })
  objFile: string;

  @Column('varchar', { name: 'obj_file_gen', length: 10 })
  objFileGen: string;

  @Column('int', { name: 'obj_priority' })
  objPriority: number;
}
