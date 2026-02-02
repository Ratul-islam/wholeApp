import 'fastify'

declare module 'fastify' {
  interface FastifyInstance {
    config: {
      MONGO_URL: string
      JWT_SECRET: string
      SMTP_PORT: string
      SMTP_PASS: string
      SMTP_USER: string
      SMTP_FROM: string
      SMTP_HOST: string
    }
  }
}


 // types/fastify.d.ts
 import "fastify";
 import type { MqttClient } from "mqtt";

 declare module "fastify" {
   interface FastifyInstance {
     mqtt: MqttClient;
   }
 }
 

