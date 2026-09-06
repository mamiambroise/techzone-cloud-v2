import { Module } from '@nestjs/common';
import { CredentialsController } from './credentials.controller';
import { CredentialService } from './credentials.service';

@Module({
  controllers: [CredentialsController],
  providers: [CredentialService],
  exports: [CredentialService],
})
export class CredentialsModule {}
