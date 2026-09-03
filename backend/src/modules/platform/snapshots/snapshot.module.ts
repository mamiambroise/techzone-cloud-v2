import { Module } from '@nestjs/common';
import { SnapshotsController } from './snapshot.controller';
import { SnapshotsService } from './snapshot.service';

@Module({
  controllers: [SnapshotsController],
  providers: [SnapshotsService],
  exports: [SnapshotsService],
})
export class SnapshotsModule {}