import { PartialType } from '@nestjs/swagger'
import { CreateHomeBannerDto } from './create-home_banner.dto'

export class UpdateHomeBannerDto extends PartialType(CreateHomeBannerDto) {}
