import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Post,
  UnauthorizedException,
  UseGuards
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { CustomerRegisterDto } from "./dto/customer-register.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { CurrentUser } from "./current-user.decorator";
import type { AuthenticatedUser } from "./auth.types";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("customer/register")
  registerCustomer(
    @Body() dto: CustomerRegisterDto,
    @Ip() ipAddress: string,
    @Headers("user-agent") userAgent?: string
  ) {
    return this.authService.registerCustomer(dto, ipAddress, userAgent);
  }

  @Post("customer/login")
  loginCustomer(
    @Body() dto: LoginDto,
    @Ip() ipAddress: string,
    @Headers("user-agent") userAgent?: string
  ) {
    return this.authService.loginCustomer(dto, ipAddress, userAgent);
  }

  @Post("staff/login")
  loginStaff(
    @Body() dto: LoginDto,
    @Ip() ipAddress: string,
    @Headers("user-agent") userAgent?: string
  ) {
    return this.authService.loginStaff(dto, ipAddress, userAgent);
  }

  @Post("refresh")
  refresh(
    @Body() dto: RefreshTokenDto,
    @Ip() ipAddress: string,
    @Headers("user-agent") userAgent?: string
  ) {
    return this.authService.refreshSession(dto.refreshToken, ipAddress, userAgent);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  logout(@CurrentUser() user?: AuthenticatedUser) {
    if (!user?.sessionId) {
      throw new UnauthorizedException("Session not found.");
    }

    return this.authService.logout(user.sessionId);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user?: AuthenticatedUser) {
    return { user };
  }
}
