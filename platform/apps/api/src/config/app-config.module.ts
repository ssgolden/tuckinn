import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { resolve } from "node:path";

const platformRoot = resolve(__dirname, "../../../../");

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        resolve(platformRoot, ".env.local"),
        resolve(platformRoot, ".env"),
        ".env.local",
        ".env"
      ]
    })
  ]
})
export class AppConfigModule {}
