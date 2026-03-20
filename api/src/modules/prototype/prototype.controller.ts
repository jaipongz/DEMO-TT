import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrototypeService } from './prototype.service';

@ApiTags('prototype')
@Controller('prototype')
export class PrototypeController {
  constructor(private readonly prototypeService: PrototypeService) {}

  @Post('lookup')
  @ApiOperation({ summary: 'Get prototype lookup options by field' })
  @ApiResponse({ status: 200, description: 'Prototype lookup options' })
  async lookup(@Body() body: { field?: string; lang?: string }) {
    return this.prototypeService.getLookup(body?.field, body?.lang);
  }
}
