import { PartialType } from '@nestjs/swagger'
import { CreateDemoJpDto } from './create-demo_jp.dto'

export class UpdateDemoJpDto extends PartialType(CreateDemoJpDto) {}
