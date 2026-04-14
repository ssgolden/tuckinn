import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { OptionalJwtAuthGuard } from "../auth/optional-jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/auth.types";
import { AddCartItemDto } from "./dto/add-cart-item.dto";
import { CreateCartDto } from "./dto/create-cart.dto";
import { UpdateCartItemDto } from "./dto/update-cart-item.dto";
import { CartsService } from "./carts.service";

@Controller("carts")
@UseGuards(OptionalJwtAuthGuard)
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  createCart(
    @Body() dto: CreateCartDto,
    @CurrentUser() user?: AuthenticatedUser
  ) {
    return this.cartsService.createCart(dto, user);
  }

  @Get(":cartId")
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  getCart(
    @Param("cartId") cartId: string,
    @CurrentUser() user?: AuthenticatedUser
  ) {
    return this.cartsService.getCart(cartId, user);
  }

  @Post(":cartId/items")
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  addItem(
    @Param("cartId") cartId: string,
    @Body() dto: AddCartItemDto,
    @CurrentUser() user?: AuthenticatedUser
  ) {
    return this.cartsService.addItem(cartId, dto, user);
  }

  @Patch(":cartId/items/:itemId")
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  updateItem(
    @Param("cartId") cartId: string,
    @Param("itemId") itemId: string,
    @Body() dto: UpdateCartItemDto,
    @CurrentUser() user?: AuthenticatedUser
  ) {
    return this.cartsService.updateItem(cartId, itemId, dto, user);
  }

  @Delete(":cartId/items/:itemId")
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  removeItem(
    @Param("cartId") cartId: string,
    @Param("itemId") itemId: string,
    @CurrentUser() user?: AuthenticatedUser
  ) {
    return this.cartsService.removeItem(cartId, itemId, user);
  }

  @Delete(":cartId")
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  deleteCart(
    @Param("cartId") cartId: string,
    @CurrentUser() user?: AuthenticatedUser
  ) {
    return this.cartsService.deleteCart(cartId, user);
  }
}