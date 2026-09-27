import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IamConfigService } from './iam-config.service';
import { IamAdminGuard } from './iam-admin-guard';

@ApiTags('iam-config')
@Controller('api/iam/config')
export class IamConfigController {
  constructor(private readonly configService: IamConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Configuration publique IAM' })
  async publicConfig() {
    const data = this.configService.getPublicConfig();
    return { success: true, message: 'OK', data };
  }

  @Get('policies')
  @ApiOperation({ summary: 'Politiques de mot de passe (publique)' })
  async passwordPolicies() {
    const data = this.configService.getPasswordPolicies();
    return { success: true, message: 'OK', data };
  }

  @Get('security')
  @UseGuards(IamAdminGuard)
  @ApiOperation({ summary: 'Configuration de sécurité (admin)' })
  async securityConfig() {
    const data = this.configService.getSecurityConfig();
    return { success: true, message: 'OK', data };
  }

  @Post('security/test')
  @UseGuards(IamAdminGuard)
  @ApiOperation({ summary: 'Tester la configuration de sécurité (admin)' })
  async testSecurity(@Body() body: { policyCode?: string; value?: string }) {
    const result = this.configService.testPolicy(body.policyCode ?? 'PASSWORD', body.value ?? '');
    return { success: true, message: 'OK', data: result };
  }

  @Get('tenants/:id')
  @UseGuards(IamAdminGuard)
  @ApiOperation({ summary: 'Configuration d un tenant (admin)' })
  async tenantConfig(@Param('id') id: string) {
    const data = this.configService.getTenantConfig(id);
    return { success: true, message: 'OK', data };
  }

  @Patch('tenants/:id')
  @UseGuards(IamAdminGuard)
  @ApiOperation({ summary: 'Mettre à jour la configuration d un tenant (admin)' })
  async updateTenantConfig(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const data = await this.configService.updateTenantConfig(id, body);
    return { success: true, message: 'Configuration mise à jour', data };
  }
}
