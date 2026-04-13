import { IsOptional, IsString, IsArray, IsUrl } from "class-validator";

export class WebhookConfigDto {
  @IsUrl({ require_protocol: true })
  endpointUrl!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  events?: string[];
}