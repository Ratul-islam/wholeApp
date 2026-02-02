import { FastifyReply } from 'fastify'

interface SuccessOptions<T> {
  data?: T
  message?: string
  statusCode?: number
}

interface ErrorOptions {
  message: string
  statusCode?: number
  errors?: any
}

export const sendSuccess = <T>(
  reply: FastifyReply,
  options: SuccessOptions<T> = {}
) => {
  const { data = null, message = 'Success', statusCode = 200 } = options
  return reply.status(statusCode).send({
    status: 'success',
    message,
    data,
  })
}

export const sendError = (
  reply: FastifyReply,
  options: ErrorOptions
) => {
  const { message, statusCode = 400, errors = null } = options
  return reply.status(statusCode).send({
    status: 'error',
    message,
    errors,
  })
}
