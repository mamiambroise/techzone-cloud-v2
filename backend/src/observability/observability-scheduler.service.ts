import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AlertEvaluatorService } from './alert-evaluator.service';
import { RetentionService } from './retention.service';

@Injectable()
export class ObservabilitySchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ObservabilitySchedulerService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  constructor(private readonly evaluator: AlertEvaluatorService, private readonly retention: RetentionService) {}
  onModuleInit() {
    if (process.env.OBSERVABILITY_SCHEDULER_ENABLED !== 'true') { this.logger.log('Scheduler Observability désactivé; les sweeps restent disponibles via API admin.'); return; }
    const minutes = Math.max(1, Number.parseInt(process.env.OBSERVABILITY_SCHEDULER_INTERVAL_MINUTES ?? '5', 10) || 5);
    this.timer = setInterval(() => void this.tick(), minutes * 60_000);
    this.logger.log(`Scheduler Observability actif (toutes les ${minutes} minute(s)).`);
  }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }
  private async tick() {
    if (this.running) return;
    this.running = true;
    try { await this.evaluator.evaluateAll(); await this.retention.runAll(true); } catch (error) { this.logger.error(error instanceof Error ? error.message : String(error)); } finally { this.running = false; }
  }
}
