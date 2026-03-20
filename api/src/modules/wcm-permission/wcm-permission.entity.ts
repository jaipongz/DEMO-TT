import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToMany,
} from 'typeorm';
import { WcmRole } from '../wcm-role/wcm-role.entity';
import { WcmUser } from '../wcm-user/wcm-user.entity';

@Entity('wcm_permissions')
export class WcmPermission {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column('varchar', { length: 255, unique: true })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('varchar', { length: 100 })
  module: string;

  @Column('varchar', { name: 'module_name', length: 150 })
  moduleName: string;

  @Column('varchar', { length: 50 })
  action: string;

  @ManyToMany(() => WcmRole, (role) => role.permissions)
  roles: WcmRole[];

  @ManyToMany(() => WcmUser, (user) => user.permissions)
  users: WcmUser[];

  @CreateDateColumn()
  createdAt: Date;
}
