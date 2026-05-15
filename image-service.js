import fs from "node:fs/promises";
import path from "node:path";

const MIME_BY_EXT = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
};

/**
 * Resolve any image source (file path, URL, data URI) into a base64 data URI
 * that can be sent directly to OpenRouter's vision endpoint.
 */
export async function resolveImageSource(source) {
  if (source.startsWith("data:")) return source;

  if (/^https?:\/\//i.test(source)) {
    const res = await fetch(source);
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const ct = res.headers.get("content-type") || "image/png";
    return `data:${ct};base64,${buf.toString("base64")}`;
  }

  if (source.startsWith("/") || source.startsWith("./") || source.startsWith("../")) {
    const buf = await fs.readFile(path.normalize(source));
    return `data:image/png;base64,${buf.toString("base64")}`;
  }

  throw new Error(`Cannot resolve image source: ${source}`);
}
