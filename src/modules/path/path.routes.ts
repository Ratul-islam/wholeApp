import { FastifyInstance } from 'fastify'
import { deletePath, getPath, savePath, updatePath } from './path.controller.js'
import { authenticateUser } from '../../middleware/auth.middleware.js'
import { savedPathController } from './savedPath.controller.js'

export default async function pathRoutes(app: FastifyInstance) {
  app.post(
    '/',
    {
      schema: {
        body: {
          type: 'object',
          required: ['name', 'path'],
          properties: {
            name: { type: 'string', minLength: 2 },
            path: { type: 'array' },
          },
        },
      },

      preHandler: async (req, res)=>authenticateUser(req, res, app)
    },
    async (request, reply) => {
      await savePath(request, reply, app)
    }
  )

  app.patch(
  '/',
  {
    schema: {
      body: {
        type: 'object',
        required: ['pathId'],
        properties: {
          pathId: { type: 'string', minLength: 1 },

          name: { type: 'string', minLength: 2 },
          path: { type: 'array' },
          isPublic: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    },
    preHandler: async (req, res) =>
      authenticateUser(req, res, app),
  },
  async (request, reply) => {
    await updatePath(request, reply)
  }
)

  app.get(
    '/',
    {
      preHandler: async (req, res)=>authenticateUser(req, res, app)
    },
    async (request, reply) => {
      await getPath(request, reply)
    }
  )

  app.delete(
    '/',
    {
      preHandler: async (req, res)=>authenticateUser(req, res, app)
    },
    async (request, reply) => {
      await deletePath(request, reply)
    }
  )
  app.post(
    "/saved",
    { preHandler: [(app as any).verifyAccess] },
    async (req, res) => savedPathController.save(req, res)
  );

  app.delete(
    "/saved/:pathId",
    { preHandler: [(app as any).verifyAccess] },
    async (req, res) => savedPathController.unsave(req, res)
  );

  app.get(
    "/saved",
    { preHandler: [(app as any).verifyAccess] },
    async (req, res) => savedPathController.list(req, res)
  );

  app.get(
    "/saved/:pathId/check",
    { preHandler: [(app as any).verifyAccess] },
    async (req, res) => savedPathController.check(req, res)
  );

}
