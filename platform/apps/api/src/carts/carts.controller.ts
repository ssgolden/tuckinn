import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post
} from "@nestjs/common";
import { AddCartItemDto } from "./dto/add-cart-item.dto";
import { CreateCartDto } from "./dto/create-cart.dto";
import { UpdateCartItemDto } from "./dto/update-cart-item.dto";
import { CartsService } from "./carts.service";

@Controller("carts")
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Post()
  createCart(@Body() dto: CreateCartDto) {
    return this.cartsService.createCart(dto);
  }

  @Get(":cartId")
  getCart(@Param("cartId") cartId: string) {
    return this.cartsService.getCart(cartId);
  }

  @Post(":cartId/items")
  addItem(@Param("cartId") cartId: string, @Body() dto: AddCartItemDto) {
    return this.cartsService.addItem(cartId, dto);
  }

  @Patch(":cartId/items/:itemId")
  updateItem(
    @Param("cartId") cartId: string,
    @Param("itemId") itemId: string,
    @Body() dto: UpdateCartItemDto
  ) {
    return this.cartsService.updateItem(cartId, itemId, dto);
  }

  @Delete(":cartId/items/:itemId")
  removeItem(@Param("cartId") cartId: string, @Param("itemId") itemId: string) {
    return this.cartsService.removeItem(cartId, itemId);
  }
}
