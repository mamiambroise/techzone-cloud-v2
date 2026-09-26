import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { IamAuthService } from './iam-auth.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser, IamAuthContext } from './decorators/current-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutAllDto } from './dto/logout-all.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  COOKIE_ACCESS_TOKEN,
  COOKIE_OPTIONS,
  COOKIE_REFRESH_TOKEN,
} from './iam.constants';

@ApiTags('iam-auth')
@Controller('iam/auth')
export class IamAuthController {
  constructor(private readonly authService: IamAuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const data = await this.authService.register(dto);
    return { success: true, message: 'Compte créé', data, statusCode: 201 };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res() res: Response) {
    const data = await this.authService.login(
      dto,
      req.ip,
      req.headers['user-agent'],
    );
    this.setTokenCookies(res, data.accessToken, data.refreshToken);
    res.json({
      success: true,
      message: data.mfaRequired ? 'MFA requis' : 'Connexion réussie',
    });
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto, @Res() res: Response) {
    const data = await this.authService.refresh(dto);
    this.setTokenCookies(res, data.accessToken, data.refreshToken);
    res.json({ success: true, message: 'Token rafraîchi' });
  }

  private setTokenCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie(COOKIE_ACCESS_TOKEN, accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie(COOKIE_REFRESH_TOKEN, refreshToken, COOKIE_OPTIONS);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() ctx: IamAuthContext, @Res() res: Response) {
    await this.authService.logout(ctx);
    res.cookie(COOKIE_ACCESS_TOKEN, '', { ...COOKIE_OPTIONS, maxAge: 0 });
    res.cookie(COOKIE_REFRESH_TOKEN, '', { ...COOKIE_OPTIONS, maxAge: 0 });
    res.json({ success: true, message: 'Déconnexion réussie' });
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(@CurrentUser() ctx: IamAuthContext, @Body() dto: LogoutAllDto, @Res() res: Response) {
    await this.authService.logoutAll(ctx, dto.keepCurrentSession);
    if (!dto.keepCurrentSession) {
      res.cookie(COOKIE_ACCESS_TOKEN, '', { ...COOKIE_OPTIONS, maxAge: 0 });
      res.cookie(COOKIE_REFRESH_TOKEN, '', { ...COOKIE_OPTIONS, maxAge: 0 });
    }
    res.json({ success: true, message: 'Toutes les sessions ont été déconnectées' });
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(@CurrentUser() ctx: IamAuthContext, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(ctx, dto);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('me')
  async me(@CurrentUser() ctx: IamAuthContext) {
    const data = await this.authService.me(ctx);
    return { success: true, message: 'OK', data };
  }

  @Patch('profile')
  async updateProfile(@CurrentUser() ctx: IamAuthContext, @Body() dto: UpdateProfileDto) {
    const data = await this.authService.updateProfile(ctx, dto);
    return { success: true, message: 'Profil mis à jour', data };
  }

  @Get('sessions')
  async sessions(@CurrentUser() ctx: IamAuthContext) {
    const data = await this.authService.sessions(ctx);
    return { success: true, message: 'OK', data };
  }
}