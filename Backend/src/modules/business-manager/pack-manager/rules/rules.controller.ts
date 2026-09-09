import { Body, Controller, Get, Param, Patch, Post, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../../../common/decorators/permissions.decorator';
import { User } from '../../../../common/decorators/user.decorator';
import type { UserContext } from '../../../../common/decorators/user.decorator';
import { Permission } from '../../../../common/enums';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { PermissionGuard } from '../../../../common/guards/permission.guard';
import { CreateRuleDto, CreateRuleTestCaseDto, RuleQueryDto, SimulateRuleDto, UpdateRuleDto } from './rule.dto';
import { RulesService } from './rules.service';

@ApiTags('Pack Manager Rules') @ApiBearerAuth() @Controller('api/v1/pack-manager') @UseGuards(AuthGuard, PermissionGuard)
export class RulesController {
  constructor(private readonly service: RulesService) {}
  @Get('versions/:versionId/rules') @Permissions(Permission.PACK_RULE_READ) list(@Param('versionId') versionId: string, @Query() query: RuleQueryDto, @User() user: UserContext) { return this.service.list(this.context(user), versionId, query); }
  @Post('versions/:versionId/rules') @Permissions(Permission.PACK_RULE_CREATE) create(@Param('versionId') versionId: string, @Body() dto: CreateRuleDto, @User() user: UserContext) { const actor = this.actor(user); return this.service.create(actor.tenantId, versionId, actor.actorId, dto); }
  @Get('rules/:id') @Permissions(Permission.PACK_RULE_READ) get(@Param('id') id: string, @User() user: UserContext) { return this.service.get(this.context(user), id); }
  @Patch('rules/:id') @Permissions(Permission.PACK_RULE_UPDATE) update(@Param('id') id: string, @Body() dto: UpdateRuleDto, @User() user: UserContext) { const actor = this.actor(user); return this.service.update(actor.tenantId, id, actor.actorId, dto); }
  @Post('rules/:id/enable') @Permissions(Permission.PACK_RULE_ENABLE) enable(@Param('id') id: string, @User() user: UserContext) { const actor = this.actor(user); return this.service.setEnabled(actor.tenantId, id, actor.actorId, true); }
  @Post('rules/:id/disable') @Permissions(Permission.PACK_RULE_DISABLE) disable(@Param('id') id: string, @User() user: UserContext) { const actor = this.actor(user); return this.service.setEnabled(actor.tenantId, id, actor.actorId, false); }
  @Post('rules/:id/validate') @Permissions(Permission.PACK_RULE_VALIDATE) validate(@Param('id') id: string, @User() user: UserContext) { const actor = this.actor(user); return this.service.validate(actor.tenantId, id, actor.actorId); }
  @Post('rules/:id/simulate') @Permissions(Permission.PACK_RULE_SIMULATE) simulate(@Param('id') id: string, @Body() dto: SimulateRuleDto, @User() user: UserContext) { const actor = this.actor(user); return this.service.simulate(actor.tenantId, id, dto, actor.actorId); }
  @Get('rules/:id/tests') @Permissions(Permission.PACK_RULE_READ) tests(@Param('id') id: string, @User() user: UserContext) { return this.service.listTests(this.context(user), id); }
  @Post('rules/:id/tests') @Permissions(Permission.PACK_RULE_MANAGE_TESTS) createTest(@Param('id') id: string, @Body() dto: CreateRuleTestCaseDto, @User() user: UserContext) { return this.service.createTest(this.context(user), id, dto); }
  @Post('rules/:id/test') @Permissions(Permission.PACK_RULE_MANAGE_TESTS) runTests(@Param('id') id: string, @User() user: UserContext) { const actor = this.actor(user); return this.service.runTests(actor.tenantId, id, actor.actorId); }
  @Get('rules/:id/impact') @Permissions(Permission.PACK_RULE_READ) impact(@Param('id') id: string, @User() user: UserContext) { return this.service.impact(this.context(user), id); }
  @Post('rules/:id/archive') @Permissions(Permission.PACK_RULE_ARCHIVE) archive(@Param('id') id: string, @User() user: UserContext) { const actor = this.actor(user); return this.service.archive(actor.tenantId, id, actor.actorId); }
  private context(user: UserContext) { if (!user.tenantId) throw new UnauthorizedException('Invalid tenant context'); return user.tenantId; }
  private actor(user: UserContext) { if (!user.tenantId || !user.id) throw new UnauthorizedException('Invalid user context'); return { tenantId: user.tenantId, actorId: user.id }; }
}
