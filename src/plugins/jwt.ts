import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";

export default fp(async (app) => {
  const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
  const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
  const RESET_SECRET = process.env.JWT_PASS_RESET_SECRET;

  if (!ACCESS_SECRET || !REFRESH_SECRET || !RESET_SECRET) {
    throw new Error("JWT_ACCESS_SECRET / JWT_REFRESH_SECRET missing");
  }

  app.register(fastifyJwt, {
  secret: ACCESS_SECRET,
  namespace: "access",
  sign: { expiresIn: "15m" },
});

app.register(fastifyJwt, {
  secret: REFRESH_SECRET,
  namespace: "refresh",
  sign: { expiresIn: "7d" },
});
app.register(fastifyJwt, {
  secret: RESET_SECRET,
  namespace: "reset",
  sign: { expiresIn: "2m" },
});


app.decorate("verifyAccess", async (request: any, reply: any) => {
  try {
    const auth = request.headers.authorization;
    const qToken = request?.query?.token;

    const token =
      typeof auth === "string" && auth.startsWith("Bearer ")
        ? auth.slice(7)
        : typeof qToken === "string"
        ? qToken
        : null;

    if (!token) return reply.code(401).send({ message: "Missing token" });

    const payload = (app.jwt as any).access.verify(token);
    request.user = payload;
  } catch {
    return reply.code(401).send({ message: "Unauthorized" });
  }
});


});
