import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const webpSignature = Buffer.from("RIFF");
const webpMarker = Buffer.from("WEBP");

function readProjectFile(path: string) {
  return readFileSync(join(process.cwd(), path));
}

function isWebp(bytes: Buffer) {
  return (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).equals(webpSignature) &&
    bytes.subarray(8, 12).equals(webpMarker)
  );
}

describe("landing artwork assets", () => {
  it.each([
    "public/landing/category-folders.webp",
    "public/landing/final-workspace.webp",
    "public/landing/hero-desktop.webp",
    "public/landing/hero-mobile.webp",
    "public/landing/jobs-board.webp",
    "public/landing/process-desktop.webp",
    "public/landing/process-mobile.webp",
    "public/landing/success-story.webp"
  ])("ships a decodable WebP file for %s", (path) => {
    expect(isWebp(readProjectFile(path))).toBe(true);
  });

  it.each([
    "public/landing/hero-desktop-repaired.webp.b64",
    "public/landing/proof-main-repaired.webp.b64"
  ])("ships a decodable base64 WebP payload for %s", (path) => {
    const base64 = readProjectFile(path).toString("utf8").trim();
    expect(isWebp(Buffer.from(base64, "base64"))).toBe(true);
  });
});
