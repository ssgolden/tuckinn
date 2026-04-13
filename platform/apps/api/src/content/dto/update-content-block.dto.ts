import { IsOptional, IsString, IsEnum } from "class-validator";

export enum ContentBlockStatus {
  draft = "draft",
  published = "published",
  archived = "archived",
}

export class UpdateContentBlockDto {
  @IsOptional()
  @IsString()
  key?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(ContentBlockStatus)
  status?: ContentBlockStatus;

  @IsOptional()
  payload?: any;
}