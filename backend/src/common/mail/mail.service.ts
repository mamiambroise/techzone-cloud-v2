import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private initializing: Promise<Transporter> | null = null;

  private buildTransporter(): Transporter {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host) {
      throw new Error(
        'SMTP_HOST manquant dans backend/.env — configurez SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/MAIL_FROM pour le mot de passe oublié',
      );
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: String(process.env.SMTP_SECURE || 'false') === 'true',
      auth: user && pass ? { user, pass } : undefined,
      tls: {
        rejectUnauthorized: String(process.env.SMTP_TLS_INSECURE || 'false') !== 'true',
      },
    });
  }

  private getTransporter(): Promise<Transporter> {
    if (this.transporter) return Promise.resolve(this.transporter);
    if (!this.initializing) {
      this.initializing = Promise.resolve().then(() => {
        this.transporter = this.buildTransporter();
        this.initializing = null;
        return this.transporter!;
      });
    }
    return this.initializing;
  }

  async send(options: SendMailOptions): Promise<boolean> {
    const from = process.env.MAIL_FROM || 'Techzone Cloud <no-reply@techzone.cloud>';
    try {
      const transporter = await this.getTransporter();
      const info = await transporter.sendMail({ from, ...options });
      this.logger.log(`Email envoyé à ${options.to} (${info.messageId})`);
      return true;
    } catch (err) {
      this.logger.error(`Échec envoi email à ${options.to}`, err as Error);
      return false;
    }
  }
}