import { sendError } from "../utils/responses.js";
export default async function errorHandler(app) {
    app.setErrorHandler((error, request, reply) => {
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
