import { FastifyInstance } from 'fastify'
import * as authController from './auth.controller.js'
import { authenticateUser } from '../../middleware/auth.middleware.js'


type RefreshBody = { refreshToken: string }

export default async function authRoutes(app: FastifyInstance) {
  app.post(
    '/register',
    {
      schema: {
        body: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'password'],
          properties: {
            firstName: { type: 'string', minLength: 2 },
            lastName: { type: 'string', minLength: 2 },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
          },
        },
      },
    },
    async (request, reply) => {
      await authController.register(app, request, reply)
    }
  )

  app.post(
    '/verify',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'code'],
          properties: {
            email: { type: 'string', format: 'email' },
            code: { type: 'string', minLength: 4 },
          }
        },
      },
    },
    async (request, reply) => {
      await authController.verify(request, reply)
    }
  )

  app.post(
    '/login',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
          },
        },
      },
    },
    async (request, reply)=>{ 
      await authController.login(request, reply,app)
    }
  )

 app.post<{ Body: { email: string; type?: "EMAIL_VERIFICATION" | "PASSWORD_RESET" } }>(
    "/resend-otp",
    authController.resendOtp
  );


  app.get<{Body: RefreshBody}>(
    '/me',
    {
      preHandler: async (req, res)=>authenticateUser(req, res, app)
    },
    authController.validateUser
  )

  app.post<{Body: RefreshBody}>(
    '/refresh',
    {
      schema: {
        body: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      await authController.refreshToken(request, reply, app)
    }
  )

   app.post<{ Body: { email: string } }>(
    '/forgot-password',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email' },
          },
        },
      },
    },
    async (request, reply) => {
      await authController.forgotPassword(app, request, reply)
    }
  )

  app.post<{ Body: { email: string; code: string; }}>(
    '/reset-password/verify',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'code'],
          properties: {
            email: { type: 'string', format: 'email' },
            code: { type: 'string', minLength: 4 },
          },
        },
      },
    },
    async (request, reply) => {
      await authController.verifyPasswordResetOtp(request, reply, app)
    }
  )

  app.post<{ Body: { resetToken: string; password: string } }>(
    '/reset-password/confirm',
    {
      schema: {
        body: {
          type: 'object',
          required: ['resetToken', 'password'],
          properties: {
            email: { type: 'string' },
            resetToken: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      await authController.confirmPasswordReset(request, reply, app)
    }
  )
  app.get(
    '/logout',
    {
      preHandler: async(req, res)=>authenticateUser(req, res, app)
    },
    authController.logout
  )
}
