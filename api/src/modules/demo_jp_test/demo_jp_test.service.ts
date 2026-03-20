import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DemoJpTest } from './demo_jp_test.entity';
import { DemoJpTestDraft } from './demo_jp_test-draft.entity';
import { CreateDemoJpTestDto } from './dto/create-demo_jp_test.dto';
import { UpdateDemoJpTestDto } from './dto/update-demo_jp_test.dto';

@Injectable()
export class DemoJpTestService {
    private readonly logger = new Logger(DemoJpTestService.name);

    constructor(
        @InjectRepository(DemoJpTest)
        private readonly mainRepository: Repository<DemoJpTest>,
        @InjectRepository(DemoJpTestDraft)
        private readonly draftRepository: Repository<DemoJpTestDraft>
    ) {}

    async create(data: CreateDemoJpTestDto) {
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
            .where('(d.demoJpTestId = :id OR d.objContentId = :id)', { id })
            .orderBy('d.objRev', 'DESC')
            .getOne();
    }

    async update(id: string, data: UpdateDemoJpTestDto) {
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
