export type SupportedImageMimeType = "image/jpeg" | "image/png" | "image/webp";

const jpegMimeTypes = new Set([
  "image/jpeg",
  "image/jfif",
  "image/jpg",
  "image/pjpeg",
]);

export function normalizeImageMimeType(
  file: Pick<File, "name" | "type">,
): SupportedImageMimeType | null {
  const mimeType = file.type.split(";")[0].trim().toLowerCase();
  if (jpegMimeTypes.has(mimeType)) return "image/jpeg";
  if (mimeType === "image/png" || mimeType === "image/webp") return mimeType;

  const isJpegFilename = /\.(?:jpe?g|jfif)$/i.test(file.name);
  if (isJpegFilename && (!mimeType || mimeType === "application/octet-stream")) {
    return "image/jpeg";
  }

  return null;
}

export function matchesFileSignature(
  bytes: Uint8Array,
  type: "image" | "pdf",
  mimeType: string,
): boolean {
  if (type === "pdf") {
    return new TextDecoder().decode(bytes.slice(0, 1024)).includes("%PDF-");
  }
  if (mimeType === "image/png") {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  }
  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === "image/webp") {
    return new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF"
      && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  }
  return false;
}
