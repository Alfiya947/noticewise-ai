import { strict as assert } from "node:assert";
import { test } from "node:test";
import { matchesFileSignature, normalizeImageMimeType } from "../lib/uploads.ts";

const jfifBytes = Uint8Array.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00,
]);

test("normalizes JFIF and JPEG MIME aliases to Gemini's JPEG MIME type", () => {
  for (const type of ["image/jpeg", "image/jfif", "image/jpg", "image/pjpeg"]) {
    assert.equal(normalizeImageMimeType({ name: "notice.jfif", type }), "image/jpeg");
  }
});

test("accepts JFIF files whose browser MIME type is absent or generic", () => {
  assert.equal(normalizeImageMimeType({ name: "notice.jfif", type: "" }), "image/jpeg");
  assert.equal(normalizeImageMimeType({ name: "notice.jfif", type: "application/octet-stream" }), "image/jpeg");
  assert.equal(matchesFileSignature(jfifBytes, "image", "image/jpeg"), true);
});

test("continues accepting supported raster images and rejects unrelated MIME types", () => {
  assert.equal(normalizeImageMimeType({ name: "notice.png", type: "image/png" }), "image/png");
  assert.equal(normalizeImageMimeType({ name: "notice.webp", type: "image/webp" }), "image/webp");
  assert.equal(normalizeImageMimeType({ name: "notice.jfif", type: "text/html" }), null);
  assert.equal(matchesFileSignature(Uint8Array.from([0x25, 0x50, 0x44, 0x46]), "image", "image/jpeg"), false);
});
