import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AddCartItemDto } from "./dto/add-cart-item.dto";
import { CreateCartDto } from "./dto/create-cart.dto";
import { UpdateCartItemDto } from "./dto/update-cart-item.dto";
import { CartsService } from "./carts.service";

// TODO: Add session-based cart ownership verification — guests should only modify their own carts

@Controller("carts")
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  createCart(@Body() dto: CreateCartDto) {
    return this.cartsService.createCart(dto);
  }

  @Get(":cartId")
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  getCart(@Param("cartId") cartId: string) {
    return this.cartsService.getCart(cartId);
  }

  @Post(":cartId/items")
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  addItem(@Param("cartId") cartId: string, @Body() dto: AddCartItemDto) {
    return this.cartsService.addItem(cartId, dto);
  }

  @Patch(":cartId/items/:itemId")
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  updateItem(
    @Param("cartId") cartId: string,
    @Param("itemId") itemId: string,
    @Body() dto: UpdateCartItemDto
  ) {
    return this.cartsService.updateItem(cartId, itemId, dto);
  }

  @Delete(":cartId/items/:itemId")
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  removeItem(@Param("cartId") cartId: string, @Param("itemId") itemId: string) {
    return this.cartsService.removeItem(cartId, itemId);
  }

  @Delete(":cartId")
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  deleteCart(@Param("cartId") cartId: string) {
    return this.cartsService.deleteCart(cartId);
  }
}
