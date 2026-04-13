import { IsEnum, IsObject, IsOptional, IsString, MinLength } from "class-validator";
import { ContentBlockStatus } from "../../../src/generated/prisma/index.js";

export class UpdateContentBlockDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  key?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsEnum(ContentBlockStatus)
  status?: ContentBlockStatus;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}