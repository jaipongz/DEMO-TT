import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { WcmRole } from './wcm-role.entity';
import { CreateWcmRoleDto } from './dto/create-wcm-role.dto';
import { UpdateWcmRoleDto } from './dto/update-wcm-role.dto';
import { WcmPermission } from '../wcm-permission/wcm-permission.entity';

type LookupOption = { value: number | string; label: string };

@Injectable()
export class WcmRoleService {
  constructor(
    @InjectRepository(WcmRole)
    private roleRepository: Repository<WcmRole>,
    @InjectRepository(WcmPermission)
    private permissionRepository: Repository<WcmPermission>,
  ) {}

  private async resolvePermissions(permissionIds?: number[]): Promise<WcmPermission[]> {
    if (!permissionIds || permissionIds.length === 0) {
      return [];
    }

    const uniqueIds = Array.from(
      new Set(
        permissionIds
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    );
    if (uniqueIds.length === 0) {
      return [];
    }

    return this.permissionRepository.find({
      where: { id: In(uniqueIds) },
    });
  }

  async create(createRoleDto: CreateWcmRoleDto): Promise<WcmRole> {
    const { permissionIds, ...payload } = createRoleDto;
    const role = this.roleRepository.create(payload);
    role.permissions = await this.resolvePermissions(permissionIds);

    const saved = await this.roleRepository.save(role);
    return (await this.findOne(saved.id)) || saved;
  }

  async findAll(): Promise<WcmRole[]> {
    return this.roleRepository.find({
      relations: ['permissions'],
      order: { createdAt: 'DESC' },
    });
  }

  async getLookup(field?: string, lang?: string): Promise<{ field: string; lang: string; options: LookupOption[] }> {
    const normalizedField = String(field || '');
    const normalizedLang = String(lang || 'en');

    if (field === 'role' || field === 'id' || field === 'name' || !field) {
      const roles = await this.roleRepository.find({ order: { name: 'ASC' } });
      return {
        field: normalizedField || 'role',
        lang: normalizedLang,
        options: roles.map((role) => ({ value: role.id, label: role.name })),
      };
    }

    return { field: normalizedField, lang: normalizedLang, options: [] };
  }

  async findOne(id: number): Promise<WcmRole | null> {
    return this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });
  }

  async findByName(name: string): Promise<WcmRole | null> {
    return this.roleRepository.findOne({
      where: { name },
      relations: ['permissions'],
    });
  }

  async update(id: number, updateRoleDto: UpdateWcmRoleDto): Promise<WcmRole | null> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });

    if (!role) {
      return null;
    }

    const { permissionIds, ...payload } = updateRoleDto;

    if (payload.name !== undefined) {
      role.name = payload.name;
    }

    if (payload.description !== undefined) {
      role.description = payload.description;
    }

    if (permissionIds !== undefined) {
      role.permissions = await this.resolvePermissions(permissionIds);
    }

    await this.roleRepository.save(role);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.roleRepository.delete(id);
  }
}
