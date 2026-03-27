export const sendSuccess = (reply, options = {}) => {
    const { data = null, message = 'Success', statusCode = 200 } = options;
    return reply.status(statusCode).send({
        status: 'success',
        message,
        data,
    });
};
export const sendError = (reply, options) => {
    const { message, statusCode = 400, errors = null } = options;
    return reply.status(statusCode).send({
        status: 'error',
        message,
        errors,
    });
};
