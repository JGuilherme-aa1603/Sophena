import sharp from "sharp";

export class SharpImageProcessor {
  constructor(
    private readonly options: {
      maxWidth: number;
      webpQuality: number;
    },
  ) {}

  async compressBookCover(input: {
    bytes: Buffer;
    mimeType: string;
  }) {
    const compressedBuffer = await sharp(input.bytes)
      .rotate()
      .resize({
        width: this.options.maxWidth,
        withoutEnlargement: true,
      })
      .webp({
        quality: this.options.webpQuality,
      })
      .toBuffer();

    return {
      bytes: compressedBuffer,
      contentType: "image/webp",
      extension: "webp",
    };
  }
}
