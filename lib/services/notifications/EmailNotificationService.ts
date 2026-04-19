import nodemailer from 'nodemailer'
import { getNotificationConfig } from '@/lib/config/env'
import { formatDateForTenant } from '@/lib/utils/tenant-timezone'

export interface TournamentCancellationEmailPayload {
  to: string
  clubName: string
  tournamentTitle: string
  date: Date
  startTime: string
  endTime: string
  timezone?: string
}

export interface EmailSendResult {
  success: boolean
  subject?: string
  error?: string
}

let transporter: nodemailer.Transporter | null = null

function getSmtpConfig() {
  const config = getNotificationConfig()
  return config.email.smtp
}

function isEmailEnabledAndConfigured(): boolean {
  const config = getNotificationConfig()
  const smtp = config.email.smtp

  return Boolean(
    config.email.enabled &&
      smtp.host &&
      smtp.port &&
      smtp.user &&
      smtp.password &&
      smtp.from
  )
}

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter

  const smtp = getSmtpConfig()
  transporter = nodemailer.createTransport({
    host: smtp.host!,
    port: smtp.port!,
    secure: smtp.port === 465,
    auth: {
      user: smtp.user!,
      pass: smtp.password!,
    },
  })

  return transporter
}

export async function sendRecurringCancelledByTournamentEmail(
  payload: TournamentCancellationEmailPayload
): Promise<EmailSendResult> {
  if (!isEmailEnabledAndConfigured()) {
    return { success: false, error: 'Notificaciones por email no habilitadas o SMTP incompleto' }
  }

  const smtp = getSmtpConfig()
  const subject = `Turno cancelado por torneo - ${payload.clubName}`
  const dateLabel = formatDateForTenant(payload.date, payload.timezone)

  const text = [
    `Hola,`,
    ``,
    `Te avisamos que tu turno fijo del ${dateLabel} de ${payload.startTime} a ${payload.endTime} no podrá jugarse.`,
    `Motivo: torneo "${payload.tournamentTitle}".`,
    ``,
    `Esta cancelación aplica solo para esa fecha. Tu turno fijo sigue vigente para las próximas semanas.`,
    ``,
    `Si necesitás reprogramar, por favor contactá al club ${payload.clubName}.`,
  ].join('\n')

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
      <p>Hola,</p>
      <p>
        Te avisamos que tu turno fijo del <strong>${dateLabel}</strong> de
        <strong>${payload.startTime}</strong> a <strong>${payload.endTime}</strong>
        no podrá jugarse.
      </p>
      <p>Motivo: torneo <strong>${payload.tournamentTitle}</strong>.</p>
      <p>
        Esta cancelación aplica solo para esa fecha.
        Tu turno fijo sigue vigente para las próximas semanas.
      </p>
      <p>Si necesitás reprogramar, por favor contactá al club <strong>${payload.clubName}</strong>.</p>
    </div>
  `.trim()

  try {
    await getTransporter().sendMail({
      from: smtp.from!,
      to: payload.to,
      subject,
      text,
      html,
    })
    return { success: true, subject }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido al enviar email'
    return { success: false, subject, error: message }
  }
}
