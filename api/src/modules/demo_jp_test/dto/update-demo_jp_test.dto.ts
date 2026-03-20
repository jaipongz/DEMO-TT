import { PartialType } from '@nestjs/swagger';
import { CreateDemoJpTestDto } from './create-demo_jp_test.dto';

export class UpdateDemoJpTestDto extends PartialType(CreateDemoJpTestDto) {}
