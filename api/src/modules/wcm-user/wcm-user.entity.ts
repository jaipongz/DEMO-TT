import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { WcmRole } from '../wcm-role/wcm-role.entity';
import { WcmPermission } from '../wcm-permission/wcm-permission.entity';

@Entity('wcm_users')
export class WcmUser {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column('varchar', { length: 255, unique: true })
  email: string;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('varchar', { length: 120, default: '' })
  firstname: string;

  @Column('varchar', { length: 120, default: '' })
  lastname: string;

  @Column('varchar', { length: 100, default: 'Asia/Bangkok' })
  timezone: string;

  @Column('varchar', { length: 255 })
  password: string;

  @Column('boolean', { default: true })
  isActive: boolean;

  @ManyToMany(() => WcmRole, (role) => role.users)
  @JoinTable({
    name: 'wcm_user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: WcmRole[];

  @ManyToMany(() => WcmPermission, (permission) => permission.users)
  @JoinTable({
    name: 'wcm_user_permissions',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: WcmPermission[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
