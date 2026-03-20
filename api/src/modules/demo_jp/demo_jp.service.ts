import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DemoJp } from './demo_jp.entity';
import { DemoJpDraft } from './demo_jp-draft.entity';
import { CreateDemoJpDto } from './dto/create-demo_jp.dto';
import { UpdateDemoJpDto } from './dto/update-demo_jp.dto';

@Injectable()
export class DemoJpService {
    private readonly logger = new Logger(DemoJpService.name);

    constructor(
        @InjectRepository(DemoJp)
        private readonly mainRepository: Repository<DemoJp>,
        @InjectRepository(DemoJpDraft)
        private readonly draftRepository: Repository<DemoJpDraft>
    ) {}

    async create(data: CreateDemoJpDto) {
        return this.draftRepository.save(this.draftRepository.create(data as any));
    }

    async findAll(query?: Record<string, unknown>) {
        void query;
        return this.draftRepository.find({
            where: { objStatus: 'active' } as any,
            order: { objModifiedDate: 'DESC' } as any
        });
    }

    async findOne(id: string) {
        return this.draftRepository
            .createQueryBuilder('d')
            .where('(d.demoJpId = :id OR d.objContentId = :id)', { id })
            .orderBy('d.objRev', 'DESC')
            .getOne();
    }

    async update(id: string, data: UpdateDemoJpDto) {
        const found = await this.findOne(id);
        if (!found) return null;
        const merged = this.draftRepository.create({ ...found, ...data });
        return this.draftRepository.save(merged);
    }

    async remove(id: string, actorId?: number) {
        const found = await this.findOne(id);
        if (!found) return;
        found.objStatus = 'delete';
        found.objModifiedBy = actorId || found.objModifiedBy;
        await this.draftRepository.save(found);
    }

    exportRows(payload: any) {
        return {
            selectedFields: payload?.fields || [],
            filters: payload?.filters || {},
            items: []
        };
    }

    getLookup(field?: string, lang?: string) {
        return {
            field: field || '',
            lang: lang || 'en',
            options: []
        };
    }
}
