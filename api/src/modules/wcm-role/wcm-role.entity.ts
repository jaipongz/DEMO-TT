import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { WcmPermission } from '../wcm-permission/wcm-permission.entity';
import { WcmUser } from '../wcm-user/wcm-user.entity';

@Entity('wcm_roles')
export class WcmRole {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column('varchar', { length: 100, unique: true })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @ManyToMany(() => WcmPermission, (permission) => permission.roles)
  @JoinTable({
    name: 'wcm_role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: WcmPermission[];

  @ManyToMany(() => WcmUser, (user) => user.roles)
  users: WcmUser[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
