import { IsOptional, IsString, IsEnum } from "class-validator";

export enum ContentBlockStatus {
  draft = "draft",
  published = "published",
  archived = "archived",
}

export class CreateContentBlockDto {
  @IsString()
  key!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsEnum(ContentBlockStatus)
  status?: ContentBlockStatus;

  @IsOptional()
  payload?: any;
}