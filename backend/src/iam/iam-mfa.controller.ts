import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IamMfaService } from './iam-mfa.service';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from './decorators/public.decorator';
import { IamJwtGuard } from './iam-jwt.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { IamAuthContext } from './decorators/current-user.decorator';
import type { Request } from 'express';

@ApiTags('iam-mfa')
@Controller('api/iam/mfa')
export class IamMfaController {
  constructor(
    private readonly mfaService: IamMfaService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('methods')
  @UseGuards(IamJwtGuard)
  @ApiOperation({ summary: 'Liste des méthodes MFA' })
  async listMethods(@CurrentUser() ctx: IamAuthContext) {
    const data = await this.mfaService.listMfaMethods(ctx.userId);
    return { success: true, message: 'OK', data };
  }

  @Post('enroll')
  @UseGuards(IamJwtGuard)
  @ApiOperation({ summary: 'Enrôler une méthode MFA' })
  async enroll(@CurrentUser() ctx: IamAuthContext, @Body() body: { type: string; label?: string }) {
    const data = await this.mfaService.enroll(ctx.userId, body.type, body.label);
    return { success: true, message: 'MFA enrôlée', data };
  }

  @Post('enroll/verify')
  @UseGuards(IamJwtGuard)
  @ApiOperation({ summary: 'Vérifier l enrôlement MFA' })
  async verifyEnrollment(@CurrentUser() ctx: IamAuthContext, @Body() body: { type: string; code: string }) {
    const data = await this.mfaService.verifyEnrollment(ctx.userId, body.type, body.code);
    return { success: true, message: 'MFA vérifiée', data };
  }

  @Delete('methods/:id')
  @UseGuards(IamJwtGuard)
  @ApiOperation({ summary: 'Révoquer une méthode MFA' })
  async revokeMethod(@CurrentUser() ctx: IamAuthContext, @Param('id') methodId: string) {
    const data = await this.mfaService.revokeMfaMethod(ctx.userId, methodId);
    return { success: true, message: 'OK', data };
  }

  @Post('recovery-codes')
  @UseGuards(IamJwtGuard)
  @ApiOperation({ summary: 'Régénérer les codes de récupération MFA' })
  async regenerateRecoveryCodes(@CurrentUser() ctx: IamAuthContext) {
    const codes = await this.mfaService.regenerateRecoveryCodes(ctx.userId);
    return { success: true, message: 'Codes régénérés', data: { codes } };
  }

  @Post('challenge/verify')
  @Public()
  @ApiOperation({ summary: 'Vérifier un challenge MFA' })
  async verifyChallenge(@Body() body: { identifier: string; code: string; recoveryCode?: string; rememberDevice?: boolean }) {
    const data = await this.mfaService.verifyMfaChallenge(body.identifier, body.code, body.recoveryCode, body.rememberDevice);
    return { success: true, message: 'MFA vérifiée', data };
  }

  @Post('challenge/remember-device')
  @UseGuards(IamJwtGuard)
  @ApiOperation({ summary: 'Remember device for MFA bypass' })
  async rememberDevice(@CurrentUser() ctx: IamAuthContext, @Req() req: Request) {
    const userAgent = req.get('user-agent') ?? '';
    await this.prisma.iamDevice.create({
      data: {
        userId: ctx.userId,
        label: userAgent || 'Unknown',
        userAgent,
        trustLevel: 'TRUSTED',
        riskScore: 0,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
      },
    });
    return { success: true, message: 'Appareil mémorisé' };
  }
}
