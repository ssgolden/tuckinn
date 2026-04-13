import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { RoleCode } from "../../src/generated/prisma/index.js";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../rbac/roles.decorator";
import { RolesGuard } from "../rbac/roles.guard";
import { MediaService } from "./media.service";

@Controller("media")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.owner, RoleCode.admin, RoleCode.manager)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  listMedia() {
    return this.mediaService.listMedia();
  }

  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024
      },
      fileFilter: (_request, file, callback) => {
        if (!file.mimetype.startsWith("image/")) {
          callback(new BadRequestException("Only image uploads are allowed."), false);
          return;
        }

        callback(null, true);
      }
    })
  )
  async uploadImage(
    @UploadedFile() file: any,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: any
  ) {
    if (!file) {
      throw new BadRequestException("Image file is required.");
    }

    const proto = request.headers["x-forwarded-proto"] || request.protocol || "http";
    const host = request.headers["x-forwarded-host"] || request.headers.host;
    const baseUrl = `${proto}://${host}`;

    return this.mediaService.saveUploadedFile(file, {
      baseUrl,
      createdById: user.sub
    });
  }

  @Delete(":mediaId")
  @Roles(RoleCode.owner, RoleCode.admin)
  deleteMedia(@Param("mediaId") mediaId: string) {
    return this.mediaService.deleteMedia(mediaId);
  }
}
