import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { WcmUser } from './wcm-user.entity';
import { CreateWcmUserDto } from './dto/create-wcm-user.dto';
import { UpdateWcmUserDto } from './dto/update-wcm-user.dto';
import * as bcrypt from 'bcrypt';
import { WcmRole } from '../wcm-role/wcm-role.entity';
import { WcmPermission } from '../wcm-permission/wcm-permission.entity';

type LookupOption = { value: string; label: string };

@Injectable()
export class WcmUserService {
  constructor(
    @InjectRepository(WcmUser)
    private userRepository: Repository<WcmUser>,
    @InjectRepository(WcmRole)
    private roleRepository: Repository<WcmRole>,
    @InjectRepository(WcmPermission)
    private permissionRepository: Repository<WcmPermission>,
  ) {}

  private normalizeIdList(values?: number[]): number[] {
    if (!values || values.length === 0) {
      return [];
    }

    return Array.from(
      new Set(
        values
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value > 0),
      ),
    );
  }

  private buildDisplayName(firstname?: string, lastname?: string, fallback?: string): string {
    const parts = [String(firstname || '').trim(), String(lastname || '').trim()].filter(Boolean);
    if (parts.length > 0) {
      return parts.join(' ');
    }

    return String(fallback || '').trim();
  }

  private async resolveRoles(roleIds?: number[]): Promise<WcmRole[]> {
    const ids = this.normalizeIdList(roleIds);
    if (ids.length === 0) {
      return [];
    }

    return this.roleRepository.find({
      where: { id: In(ids) },
    });
  }

  private async resolvePermissions(permissionIds?: number[]): Promise<WcmPermission[]> {
    const ids = this.normalizeIdList(permissionIds);
    if (ids.length === 0) {
      return [];
    }

    return this.permissionRepository.find({
      where: { id: In(ids) },
    });
  }

  async create(createCmsUserDto: CreateWcmUserDto): Promise<WcmUser> {
    const { roleIds, permissionIds, firstname, lastname, timezone, ...basePayload } = createCmsUserDto;
    const hashedPassword = await bcrypt.hash(createCmsUserDto.password, 10);
    const displayName = this.buildDisplayName(firstname, lastname, basePayload.name);

    const user = this.userRepository.create({
      ...basePayload,
      name: displayName,
      firstname: String(firstname || '').trim(),
      lastname: String(lastname || '').trim(),
      timezone: String(timezone || 'Asia/Bangkok').trim() || 'Asia/Bangkok',
      password: hashedPassword,
    });

    user.roles = await this.resolveRoles(roleIds);
    user.permissions = await this.resolvePermissions(permissionIds);

    const saved = await this.userRepository.save(user);
    return (await this.findOne(saved.id)) || saved;
  }

  async findAll(): Promise<WcmUser[]> {
    return this.userRepository.find({
      relations: ['roles', 'roles.permissions', 'permissions'],
      order: { createdAt: 'DESC' },
    });
  }

  async getLookup(field?: string, lang?: string): Promise<{ field: string; lang: string; options: LookupOption[] }> {
    const normalizedField = String(field || '');
    const normalizedLang = String(lang || 'en');

    if (field === 'status') {
      return {
        field: normalizedField || 'status',
        lang: normalizedLang,
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ],
      };
    }

    return { field: normalizedField, lang: normalizedLang, options: [] };
  }

  async findOne(id: number): Promise<WcmUser | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions', 'permissions'],
    });
  }

  async findByEmail(email: string): Promise<WcmUser | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['roles', 'roles.permissions', 'permissions'],
    });
  }

  async update(id: number, updateCmsUserDto: UpdateWcmUserDto): Promise<WcmUser | null> {
    const existing = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'permissions'],
    });

    if (!existing) {
      return null;
    }

    const { roleIds, permissionIds, firstname, lastname, timezone, ...basePayload } = updateCmsUserDto;

    if (updateCmsUserDto.password) {
      basePayload.password = await bcrypt.hash(updateCmsUserDto.password, 10);
    }

    if (basePayload.email !== undefined) {
      existing.email = basePayload.email;
    }

    const nextFirstname = firstname !== undefined ? String(firstname).trim() : existing.firstname;
    const nextLastname = lastname !== undefined ? String(lastname).trim() : existing.lastname;
    const nextNameCandidate = basePayload.name !== undefined ? basePayload.name : existing.name;

    if (firstname !== undefined) {
      existing.firstname = nextFirstname;
    }

    if (lastname !== undefined) {
      existing.lastname = nextLastname;
    }

    existing.name = this.buildDisplayName(nextFirstname, nextLastname, nextNameCandidate);

    if (basePayload.password !== undefined) {
      existing.password = basePayload.password;
    }

    if (basePayload.isActive !== undefined) {
      existing.isActive = basePayload.isActive;
    }

    if (timezone !== undefined) {
      existing.timezone = String(timezone || 'Asia/Bangkok').trim() || 'Asia/Bangkok';
    }

    if (roleIds !== undefined) {
      existing.roles = await this.resolveRoles(roleIds);
    }

    if (permissionIds !== undefined) {
      existing.permissions = await this.resolvePermissions(permissionIds);
    }

    await this.userRepository.save(existing);
    return this.findOne(id);
  }

  async resetPassword(id: number, password: string): Promise<WcmUser | null> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      return null;
    }

    user.password = await bcrypt.hash(String(password || '').trim(), 10);
    await this.userRepository.save(user);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    const result = await bcrypt.compare(password, hashedPassword);
    console.log('🔐 Password comparison:', {
      inputLength: password.length,
      hashLength: hashedPassword.length,
      match: result,
    });
    return result;
  }
}
