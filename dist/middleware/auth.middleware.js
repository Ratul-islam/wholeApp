import { AppError } from '../utils/AppError.js';
import { sendError } from '../utils/responses.js';
export async function authenticateUser(req, reply, app) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader)
            throw new AppError('Missing Authorization header', 401);
        const token = authHeader.replace('Bearer ', '').trim();
        if (!token)
            throw new AppError('Invalid token format', 401);
        const payload = app.jwt.access.verify(token);
        if (payload.type !== 'user') {
            throw new AppError('Invalid token type', 403);
        }
        ;
        req.user = payload;
    }
    catch (err) {
        if (!(err instanceof AppError)) {
            err = new AppError(err.message || 'Unauthorized', err.statusCode || 403);
        }
        return sendError(reply, { statusCode: err.statusCode, message: err.message });
    }
}
