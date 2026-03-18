import sharp from "sharp";
import { readFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, "..");
const svgPath = resolve(root, "public", "icon.svg");
const svg = readFileSync(svgPath);

const sizes = [192, 512];

for (const size of sizes) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(resolve(root, "public", `icon-${size}.png`));
  console.log(`✓ icon-${size}.png generated`);
}
