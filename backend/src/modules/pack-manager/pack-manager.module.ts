import { Module } from '@nestjs/common';
<<<<<<< HEAD
=======

>>>>>>> dc5feb88fd597836d806457a7b2a50727b017d02
import { PackManagerController } from './pack-manager.controller';
import { PackManagerService } from './pack-manager.service';

@Module({
  controllers: [PackManagerController],
  providers: [PackManagerService],
  exports: [PackManagerService],
})
export class PackManagerModule {}
