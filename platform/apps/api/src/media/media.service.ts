import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import { extname, join } from "path";
import { PrismaService } from "../prisma/prisma.service";

type UploadedFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Injectable()
export class MediaService {
  private readonly uploadRoot = join(process.cwd(), "data", "uploads");

  constructor(private readonly prisma: PrismaService) {}

  getUploadRoot() {
    return this.uploadRoot;
  }

  async saveUploadedFile(
    file: UploadedFile,
    options: { baseUrl: string; createdById?: string | null; altText?: string | null }
  ) {
    const extension = extname(file.originalname) || this.extensionForMime(file.mimetype);
    const filename = `${Date.now()}-${randomUUID()}${extension}`;

    await fs.mkdir(this.uploadRoot, { recursive: true });
    await fs.writeFile(join(this.uploadRoot, filename), file.buffer);

    const url = `${options.baseUrl}/uploads/${filename}`;
    const asset = await this.prisma.mediaAsset.create({
      data: {
        storageKey: `upload:${filename}`,
        url,
        altText: options.altText ?? null,
        mimeType: file.mimetype || this.mimeForExtension(extension),
        fileSizeBytes: BigInt(file.size),
        createdById: options.createdById ?? null
      }
    });

    return {
      id: asset.id,
      url: asset.url,
      altText: asset.altText,
      mimeType: asset.mimeType,
      fileSizeBytes: Number(asset.fileSizeBytes ?? 0)
    };
  }

  private extensionForMime(mimeType: string) {
    switch (mimeType) {
      case "image/png":
        return ".png";
      case "image/webp":
        return ".webp";
      case "image/gif":
        return ".gif";
      default:
        return ".jpg";
    }
  }

  private mimeForExtension(extension: string) {
    switch (extension.toLowerCase()) {
      case ".png":
        return "image/png";
      case ".webp":
        return "image/webp";
      case ".gif":
        return "image/gif";
      default:
        return "image/jpeg";
    }
  }
}
