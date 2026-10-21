import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';

@Injectable()
export class NotificationRouterService {
  constructor(private readonly prisma: PrismaService, private readonly mail: MailService) {}

  async dispatch(alertId: string) {
    const alert = await this.prisma.observabilityAlert.findUnique({ where: { id: alertId } });
    if (!alert) return [];
    const routes = await this.prisma.observabilityNotificationRoute.findMany({ where: { enabled: true, AND: [alert.tenantId ? { OR: [{ tenantId: alert.tenantId }, { tenantId: null }] } : { tenantId: null }, { OR: [{ severity: null }, { severity: alert.severity }] }] } });
    const results = [];
    for (const route of routes) {
      const recipients = Array.isArray(route.recipients) ? route.recipients.filter((value): value is string => typeof value === 'string').slice(0, 20) : [];
      for (const recipient of recipients) results.push(await this.dispatchOne(alert, route, recipient));
    }
    return results;
  }

  private async dispatchOne(alert: { id: string; summary: string; severity: string; description: string | null }, route: { id: string; channel: string; cooldownSec: number }, recipient: string) {
    const after = new Date(Date.now() - route.cooldownSec * 1000);
    const recent = await this.prisma.observabilityNotificationAttempt.findFirst({ where: { alertId: alert.id, routeId: route.id, recipient, attemptedAt: { gte: after }, status: 'SENT' } });
    if (recent) return { status: 'COOLDOWN', recipient };
    const attempt = await this.prisma.observabilityNotificationAttempt.create({ data: { alertId: alert.id, routeId: route.id, channel: route.channel, recipient, status: 'PENDING' } });
    if (route.channel !== 'EMAIL' || process.env.OBSERVABILITY_NOTIFICATIONS_ENABLED !== 'true' || !process.env.SMTP_HOST) {
      await this.prisma.observabilityNotificationAttempt.update({ where: { id: attempt.id }, data: { status: 'SKIPPED', errorCode: route.channel === 'EMAIL' ? 'PROVIDER_NOT_CONFIGURED' : 'CHANNEL_UNAVAILABLE' } });
      return { status: 'SKIPPED', recipient };
    }
    const sent = await this.mail.send({ to: recipient, subject: `[${alert.severity}] ${alert.summary}`, html: `<p>${alert.description ?? alert.summary}</p>` });
    await this.prisma.observabilityNotificationAttempt.update({ where: { id: attempt.id }, data: sent ? { status: 'SENT', sentAt: new Date() } : { status: 'FAILED', errorCode: 'EMAIL_DELIVERY_FAILED' } });
    return { status: sent ? 'SENT' : 'FAILED', recipient };
  }
}
