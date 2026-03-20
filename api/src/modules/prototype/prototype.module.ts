import { Module } from '@nestjs/common';
import { PrototypeController } from './prototype.controller';
import { PrototypeService } from './prototype.service';

@Module({
  controllers: [PrototypeController],
  providers: [PrototypeService],
})
export class PrototypeModule {}
