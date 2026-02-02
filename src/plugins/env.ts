import fp from 'fastify-plugin'
import fastifyEnv from '@fastify/env'

const schema = {
  type: 'object',
  required: ['MONGO_URL', 'JWT_SECRET','SMTP_PORT','SMTP_USER','SMTP_PASS', 'SMTP_FROM'],
  properties: {
    MONGO_URL: { type: 'string' },
    JWT_SECRET: { type: 'string' },
    SMTP_PORT: { type: 'string' },
    SMTP_USER: { type: 'string' },
    SMTP_PASS: { type: 'string' },
    SMTP_FROM: { type: 'string' }
  }
}

export default fp(async (fastify) => {
  await fastify.register(fastifyEnv, {
    schema,
    dotenv: true,
    data: process.env,
    confKey: 'config',
  })
})
