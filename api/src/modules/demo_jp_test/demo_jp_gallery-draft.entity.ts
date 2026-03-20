import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('demo_jp_gallery_draft')
export class DemoJpGalleryDraft {
  @PrimaryColumn({ type: 'bigint', name: 'demo_jp_gallery_id' })
  demoJpGalleryId: string;

  @Column('bigint', { name: 'obj_parent_id' })
  objParentId: string;

  @Column('varchar', { name: 'obj_file', length: 255 })
  objFile: string;

  @Column('varchar', { name: 'obj_file_gen', length: 10 })
  objFileGen: string;

  @Column('int', { name: 'obj_priority' })
  objPriority: number;

  @PrimaryColumn({ type: 'varchar', name: 'obj_lang', length: 10 })
  objLang: string;

  @PrimaryColumn({ type: 'int', name: 'obj_rev' })
  objRev: number;
}
