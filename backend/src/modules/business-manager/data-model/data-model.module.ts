import { Module } from '@nestjs/common';
import { DataModelController } from './data-model.controller';
import { DataModelService } from './data-model.service';

@Module({
  controllers: [DataModelController],
  providers: [DataModelService],
  exports: [DataModelService],
})
export class DataModelModule {}
