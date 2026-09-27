import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IamAuthService } from './iam-auth.service';
import { IamJwtGuard } from './iam-jwt.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { IamAuthContext } from './decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('iam-profile')
@UseGuards(IamJwtGuard)
@Controller('api/iam')
export class IamProfileController {
  constructor(private readonly authService: IamAuthService) {}

  @Get('me')
  @ApiOperation({ summary: 'Profil utilisateur courant' })
  async me(@CurrentUser() ctx: IamAuthContext) {
    const data = await this.authService.me(ctx);
    return { success: true, message: 'OK', data };
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Mettre à jour le profil utilisateur courant' })
  async updateProfile(@CurrentUser() ctx: IamAuthContext, @Body() dto: UpdateProfileDto) {
    const data = await this.authService.updateProfile(ctx, dto);
    return { success: true, message: 'Profil mis à jour', data };
  }
}
