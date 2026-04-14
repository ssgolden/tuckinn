import { Module } from "@nestjs/common";
import { CartsController } from "./carts.controller";
import { CartsService } from "./carts.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [CartsController],
  providers: [CartsService],
  exports: [CartsService]
})
export class CartsModule {}