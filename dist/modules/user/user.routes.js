import { getUserProfile } from "./user.controller.js";
export default async function userRoutes(app) {
    app.get("/", { preHandler: [app.verifyAccess] }, async (req, reply) => {
        await getUserProfile(req, reply);
    });
}
