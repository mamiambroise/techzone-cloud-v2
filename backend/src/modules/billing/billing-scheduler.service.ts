import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BillingLifecycleService } from './lifecycle/billing-lifecycle.service';

/**
 * Declencheur periodique des sweeps Billing (CDC 51/52/112).
 *
 * Le scheduler est OPTIONNEL : il s'active uniquement si
 * `BILLING_SCHEDULER_ENABLED=true`. Sans lui, la route
 * `POST /api/billing/admin/sweeps` permet le meme traitement a la demande —
 * aucune ecriture automatique n'est consideree comme acquise (CDC 44 : rien
 * n'est simule).
 *
 * Aucun cron externe n'est requis : un simple setInterval suffit et reste
 * explicite. Un tick en cours ne peut jamais en declencher un second.
 */
@Injectable()
export class BillingSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(BillingSchedulerService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(private readonly lifecycle: BillingLifecycleService) {}

  onModuleInit(): void {
    if (process.env.BILLING_SCHEDULER_ENABLED !== 'true') {
      this.logger.log(
        'Scheduler Billing desactive (BILLING_SCHEDULER_ENABLED != true). Les sweeps restent accessibles via POST /api/billing/admin/sweeps.',
      );
      return;
    }
    const intervalMinutes = Number.parseInt(process.env.BILLING_SCHEDULER_INTERVAL_MINUTES ?? '60', 10);
    const intervalMs = Math.max(1, Number.isFinite(intervalMinutes) ? intervalMinutes : 60) * 60_000;
    this.timer = setInterval(() => {
      void this.tick();
    }, intervalMs);
    this.logger.log(`Scheduler Billing actif (toutes les ${intervalMs / 60_000} minute(s)).`);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async tick(): Promise<void> {
    if (this.running) {
      this.logger.warn('Sweep Billing deja en cours : ce tick est ignore.');
      return;
    }
    this.running = true;
    try {
      await this.lifecycle.runAllSweeps();
    } catch (error) {
      this.logger.error(`Sweep Billing en echec : ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.running = false;
    }
  }
}