import { buildApp } from './application.js';
const app = await buildApp();
const PORT = Number(process.env.PORT || 8000);
try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Server started at ${PORT}`);
}
catch (err) {
    app.log.error(err);
    process.exit(1);
}
export default app;
