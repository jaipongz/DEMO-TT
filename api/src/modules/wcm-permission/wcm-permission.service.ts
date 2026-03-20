import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WcmPermission } from './wcm-permission.entity';
import { CreateWcmPermissionDto } from './dto/create-wcm-permission.dto';
import { UpdateWcmPermissionDto } from './dto/update-wcm-permission.dto';

type LookupOption = { value: string; label: string };

@Injectable()
export class WcmPermissionService {
  constructor(
    @InjectRepository(WcmPermission)
    private permissionRepository: Repository<WcmPermission>,
  ) {}

  private normalizeModuleDisplayName(payload: Partial<CreateWcmPermissionDto & UpdateWcmPermissionDto>): Partial<WcmPermission> {
    const normalized: Record<string, any> = { ...payload };
    const hasModule = Object.prototype.hasOwnProperty.call(payload, 'module');
    const hasModuleName = Object.prototype.hasOwnProperty.call(payload as any, 'module_name');

    if (hasModule) {
      normalized.module = String(payload?.module || '').trim();
    }

    if (hasModule || hasModuleName) {
      const rawModuleName = String((payload as any)?.module_name || '').trim();
      normalized.moduleName = rawModuleName || normalized.module;
    }

    delete normalized.module_name;
    return normalized as Partial<WcmPermission>;
  }

  async create(createPermissionDto: CreateWcmPermissionDto): Promise<WcmPermission> {
    const permission = this.permissionRepository.create(this.normalizeModuleDisplayName(createPermissionDto));
    return this.permissionRepository.save(permission);
  }

  async findAll(): Promise<WcmPermission[]> {
    return this.permissionRepository.find({
      order: { module: 'ASC', action: 'ASC' },
    });
  }

  async getLookup(field?: string, lang?: string): Promise<{ field: string; lang: string; options: LookupOption[] }> {
    const normalizedField = String(field || '');
    const normalizedLang = String(lang || 'en');

    if (field === 'module') {
      const rows = await this.permissionRepository
        .createQueryBuilder('permission')
        .select('permission.module', 'module')
        .where('permission.module IS NOT NULL')
        .andWhere("permission.module <> ''")
        .distinct(true)
        .orderBy('permission.module', 'ASC')
        .getRawMany<{ module: string }>();

      return {
        field: normalizedField || 'module',
        lang: normalizedLang,
        options: rows.map((item) => ({ value: item.module, label: item.module })),
      };
    }

    return { field: normalizedField, lang: normalizedLang, options: [] };
  }

  async findOne(id: number): Promise<WcmPermission | null> {
    return this.permissionRepository.findOne({
      where: { id },
    });
  }

  async findByName(name: string): Promise<WcmPermission | null> {
    return this.permissionRepository.findOne({
      where: { name },
    });
  }

  async update(id: number, updatePermissionDto: UpdateWcmPermissionDto): Promise<WcmPermission | null> {
    await this.permissionRepository.update(id, this.normalizeModuleDisplayName(updatePermissionDto));
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.permissionRepository.delete(id);
  }
}
