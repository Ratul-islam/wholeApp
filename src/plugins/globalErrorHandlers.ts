import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { sendError } from "../utils/responses.js";

export default async function errorHandler(app: FastifyInstance) {
  app.setErrorHandler((error: any, request: FastifyRequest, reply: FastifyReply) => {
    if (error.code === "FST_ERR_VALIDATION" || error.validation) {
      return sendError(reply, {
        statusCode: 402,
        message: "Validation error",
        errors: {
          message: error.message,
          details: error.validation ?? [],
        },
      });
    }

    return sendError(reply, {
      statusCode: error.statusCode ?? 500,
      message: error.message ?? "Internal Server Error",
    });
  });
}
