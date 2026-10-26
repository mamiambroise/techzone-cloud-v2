import { Module } from '@nestjs/common';
import { RuntimeExecutionService } from './runtime-execution.service';

@Module({ providers: [RuntimeExecutionService], exports: [RuntimeExecutionService] })
export class RuntimeExecutionModule {}
