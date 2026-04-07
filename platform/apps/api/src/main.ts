import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { Request, Response } from "express";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true
  });
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);
  const expressApp = app.getHttpAdapter().getInstance();

  expressApp.get("/", (_request: Request, response: Response) => {
    response.json({
      service: "tuckinn-api",
      status: "ok",
      docs: {
        health: "/api/health",
        catalog: "/api/catalog/public?locationCode=main"
      }
    });
  });

  expressApp.get("/api", (_request: Request, response: Response) => {
    response.json({
      service: "tuckinn-api",
      status: "ok",
      endpoints: [
        "/api/health",
        "/api/catalog/public?locationCode=main",
        "/api/auth/staff/login"
      ]
    });
  });

  app.setGlobalPrefix("api");
  app.enableCors({
    origin:
      process.env.NODE_ENV === "production" && allowedOrigins.length
        ? allowedOrigins
        : true,
    credentials: true
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  );

  const port = Number(process.env.PORT || 3200);
  await app.listen(port);
}

void bootstrap();
