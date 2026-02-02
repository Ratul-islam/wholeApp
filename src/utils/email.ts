import nodemailer from 'nodemailer'
import type { FastifyInstance } from 'fastify'
import 'dotenv/config'


interface EmailOptions {
  to: string
  subject: string
  html: string
}

export const sendEmail = async (fastify: FastifyInstance, { to, subject, html }: EmailOptions) => {
  console.log(process.env.SMTP_HOST)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    html,
  })
}
