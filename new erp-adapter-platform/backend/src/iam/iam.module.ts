import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from '../prisma/prisma.module';
import { IamAuthService } from './iam-auth.service';
import { IamJwtGuard } from './iam-jwt.guard';
import { IamAuthController } from './iam-auth.controller';

@Module({
  imports: [PrismaModule],
  controllers: [IamAuthController],
  providers: [
    IamAuthService,
    {
      provide: APP_GUARD,
      useClass: IamJwtGuard,
    },
  ],
  exports: [IamAuthService],
})
export class IamModule {}