import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from '../prisma/prisma.module';
import { IamAuthService } from './iam-auth.service';
import { IamAdminService } from './iam-admin.service';
import { IamJwtGuard } from './iam-jwt.guard';
import { IamAuthController } from './iam-auth.controller';
import { IamUsersController } from './iam-users.controller';
import { IamSessionsController } from './iam-sessions.controller';

@Module({
  imports: [PrismaModule],
  controllers: [IamAuthController, IamUsersController, IamSessionsController],
  providers: [
    IamAuthService,
    IamAdminService,
    {
      provide: APP_GUARD,
      useClass: IamJwtGuard,
    },
  ],
  exports: [IamAuthService, IamAdminService],
})
export class IamModule {}