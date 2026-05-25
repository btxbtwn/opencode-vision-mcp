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

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_BY_EXT[ext] || "image/png";
}

/**
 * Resolve any image source (file path, file:// URI, https:// URL, data URI)
 * into a base64 data URI for OpenRouter vision endpoints.
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

  let filePath = source;

  // Strip file:// prefix and URL-decode (e.g. %20 → space, %28 → ()
  if (/^file:\/\//i.test(filePath)) {
    filePath = filePath.replace(/^file:\/\/+/, "/");
  }
  filePath = decodeURIComponent(filePath);

  if (filePath.startsWith("/") || filePath.startsWith("./") || filePath.startsWith("../")) {
    filePath = path.normalize(filePath);
    try {
      const buf = await fs.readFile(filePath);
      const mime = getMimeType(filePath);
      return `data:${mime};base64,${buf.toString("base64")}`;
    } catch (e) {
      if (e.code === "ENOENT") {
        throw new Error(`Image file not found: ${filePath}`);
      }
      throw e;
    }
  }

  throw new Error(`Cannot resolve image source: ${source}`);
}
