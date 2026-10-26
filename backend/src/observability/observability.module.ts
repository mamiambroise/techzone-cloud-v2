import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../common/mail/mail.module';
import { AlertEvaluatorService } from './alert-evaluator.service';
import { NotificationRouterService } from './notification-router.service';
import { RetentionService } from './retention.service';
import { ObservabilitySchedulerService } from './observability-scheduler.service';
import { ObservabilityController } from './observability.controller';
import { MetricRecorderService } from './metric-recorder.service';
import { ObservabilityService } from './observability.service';
import { RedactionService } from './redaction.service';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [ObservabilityController],
  providers: [MetricRecorderService, RedactionService, ObservabilityService, AlertEvaluatorService, NotificationRouterService, RetentionService, ObservabilitySchedulerService],
  exports: [ObservabilityService, MetricRecorderService, RedactionService],
})
export class ObservabilityModule {}
