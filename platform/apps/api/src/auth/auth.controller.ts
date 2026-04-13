import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { CustomerRegisterDto } from "./dto/customer-register.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { CurrentUser } from "./current-user.decorator";
import type { AuthenticatedUser } from "./auth.types";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("customer/register")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  registerCustomer(
    @Body() dto: CustomerRegisterDto,
    @Ip() ipAddress: string,
    @Headers("user-agent") userAgent?: string
  ) {
    return this.authService.registerCustomer(dto, ipAddress, userAgent);
  }

  @Post("customer/login")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  loginCustomer(
    @Body() dto: LoginDto,
    @Ip() ipAddress: string,
    @Headers("user-agent") userAgent?: string
  ) {
    return this.authService.loginCustomer(dto, ipAddress, userAgent);
  }

  @Post("staff/login")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  loginStaff(
    @Body() dto: LoginDto,
    @Ip() ipAddress: string,
    @Headers("user-agent") userAgent?: string
  ) {
    return this.authService.loginStaff(dto, ipAddress, userAgent);
  }

  @Post("refresh")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
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

  @Post("forgot-password")
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post("reset-password")
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user?: AuthenticatedUser) {
    return { user };
  }

  @Patch("password")
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() req: { user?: AuthenticatedUser }
  ) {
    if (!req.user) {
      throw new UnauthorizedException("Not authenticated.");
    }
    return this.authService.changePassword(req.user.sub, dto);
  }
}
