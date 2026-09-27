import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from './decorators/public.decorator';

@ApiTags('iam-health')
@Controller('api/iam/health')
export class IamHealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'IAM Health check' })
  async health() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { success: true, message: 'Service disponible', data: { status: 'healthy', timestamp: new Date().toISOString() } };
    } catch {
      return { success: false, message: 'Service indisponible', data: { status: 'unhealthy', timestamp: new Date().toISOString() } };
    }
  }

  @Get('ready')
  @Public()
  @ApiOperation({ summary: 'IAM Readiness check' })
  async ready() {
    return { success: true, message: 'Prêt', data: { status: 'ready', timestamp: new Date().toISOString() } };
  }
}
