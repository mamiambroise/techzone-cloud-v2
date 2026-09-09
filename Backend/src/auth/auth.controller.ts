import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/enums';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.auth.login(body.email, body.password);
  }

  @Get('users')
  @UseGuards(AuthGuard)
  @Permissions(Permission.IAM_USER_READ)
  users() {
    return this.auth.listUsers();
  }

  @Post('users')
  @UseGuards(AuthGuard)
  @Permissions(Permission.IAM_USER_CREATE)
  createUser(@Body() body: { email: string; name: string; role?: string; password: string }) {
    return this.auth.createUser(body);
  }
}
