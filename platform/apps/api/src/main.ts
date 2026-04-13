import { ValidationPipe } from "@nestjs/common";
import express from "express";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
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
  const uploadRoot = join(process.cwd(), "data", "uploads");

  if (!existsSync(uploadRoot)) {
    mkdirSync(uploadRoot, { recursive: true });
  }

  expressApp.use("/uploads", express.static(uploadRoot));

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
      process.env.NODE_ENV === "production"
        ? allowedOrigins.length
          ? allowedOrigins
          : []
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

  const config = new DocumentBuilder()
    .setTitle("Tuckinn Proper API")
    .setDescription("Food ordering platform API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = Number(process.env.PORT || 3200);
  await app.listen(port);
}

void bootstrap();
