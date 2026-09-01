import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SentEmail {
  to: string;
  subject: string;
  body: string;
}

/**
 * Envoi d'e-mails transactionnels via SMTP (nodemailer).
 *
 * Si `SMTP_HOST` n'est pas configuré, le service bascule en mode simulé :
 * le message est seulement journalisé (`[MAIL:SIMULÉ]`), ce qui garde le
 * développement local, la CI et les tests fonctionnels sans serveur mail.
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private from = 'ArchiVision <no-reply@archivision.local>';

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const host = this.config.get<string>('SMTP_HOST');
    this.from = this.config.get<string>('MAIL_FROM') ?? this.from;

    if (!host) {
      this.logger.warn('SMTP_HOST absent : envoi d\'e-mails en mode simulé (journalisation seule).');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: Number(this.config.get<string>('SMTP_PORT') ?? 587),
      secure: this.config.get<string>('SMTP_SECURE') === 'true',
      auth: this.config.get<string>('SMTP_USER')
        ? {
            user: this.config.get<string>('SMTP_USER'),
            pass: this.config.get<string>('SMTP_PASS'),
          }
        : undefined,
    });
    this.logger.log(`Transport SMTP configuré (${host}).`);
  }

  /** Organisation validée : lien de connexion à l'application. */
  async sendOrganisationValidee(to: string, organisationNom: string, loginUrl: string): Promise<SentEmail> {
    return this.send({
      to,
      subject: 'Bienvenue sur ArchiVision : votre organisation est validée',
      body:
        `Bonjour,\n\nVotre organisation « ${organisationNom} » a été validée par notre équipe. ` +
        `Vous pouvez désormais vous connecter à ArchiVision :\n\n${loginUrl}\n\nÀ bientôt !`,
    });
  }

  /** Organisation rejetée : notification sans lien. */
  async sendOrganisationRejetee(to: string, organisationNom: string): Promise<SentEmail> {
    return this.send({
      to,
      subject: "ArchiVision : votre demande d'inscription",
      body:
        `Bonjour,\n\nNous ne sommes pas en mesure de donner suite à l'inscription de ` +
        `« ${organisationNom} » pour le moment.\n\nCordialement.`,
    });
  }

  private async send(email: SentEmail): Promise<SentEmail> {
    if (!this.transporter) {
      this.logger.log(`[MAIL:SIMULÉ] À: ${email.to} | Sujet: ${email.subject}\n${email.body}`);
      return email;
    }
    await this.transporter.sendMail({
      from: this.from,
      to: email.to,
      subject: email.subject,
      text: email.body,
    });
    this.logger.log(`E-mail envoyé à ${email.to} (${email.subject}).`);
    return email;
  }
}
