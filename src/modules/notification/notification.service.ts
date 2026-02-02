import { sendEmail } from '../../utils/email.js'
import { emailTemplates } from './email.template.js'
import type { IOTP } from '../otp/otp.model.js'
import type { FastifyInstance } from 'fastify'

export const sendOTPEmail = async (
  fastify: FastifyInstance,
  email: string,
  otp: string,
  type: IOTP['type'],
  expiresInMinutes: number
) => {
  const template = emailTemplates[type]
  if (!template) {
    throw new Error(`No email template defined for OTP type: ${type}`)
  }

  const { subject, html } = template(otp, expiresInMinutes)
  console.log(otp)

  await sendEmail(fastify, { to: email, subject, html })
}
