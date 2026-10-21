import { inflateRawSync } from "node:zlib";
import { RecipePackageError, type PackageEnvelope } from "@/lib/recipes/package";

export const MAX_RECIPE_ZIP_BYTES = 1_500_000;
const MAX_TEXT_BYTES = 4_000_000;
const MAX_FILE_BYTES = 256 * 1024;
const allowed = /\.(?:md|txt|json|ya?ml|py|js|ts|sh)$/i;

const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let value = i;
  for (let j = 0; j < 8; j++) value = value & 1 ? (value >>> 1) ^ 0xedb88320 : value >>> 1;
  crcTable[i] = value >>> 0;
}
function crc32(bytes: Uint8Array): number {
  let value = 0xffffffff;
  for (const byte of bytes) value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}
type Entry = {
  name: string;
  method: number;
  compressedSize: number;
  size: number;
  crc: number;
  offset: number;
};

/** Bounded ZIP reader for text-only recipe intake. No files are written or run. */
export function readRecipeZip(bytes: Uint8Array): PackageEnvelope {
  if (!bytes.length || bytes.byteLength > MAX_RECIPE_ZIP_BYTES)
    throw new RecipePackageError("Choose a ZIP smaller than 1.5 MB.");
  const data = Buffer.from(bytes);
  let eocd = -1;
  for (let i = data.length - 22; i >= Math.max(0, data.length - 65557); i--) {
    if (data.readUInt32LE(i) === 0x06054b50 && i + 22 + data.readUInt16LE(i + 20) === data.length) {
      eocd = i; break;
    }
  }
  if (eocd < 0) throw new RecipePackageError("This is not a supported ZIP archive.");
  const count = data.readUInt16LE(eocd + 10);
  const directorySize = data.readUInt32LE(eocd + 12);
  const directoryOffset = data.readUInt32LE(eocd + 16);
  if (data.readUInt16LE(eocd + 4) || data.readUInt16LE(eocd + 6) ||
      count !== data.readUInt16LE(eocd + 8) || count > 1024 ||
      count === 0xffff || directoryOffset === 0xffffffff ||
      directoryOffset + directorySize > eocd)
    throw new RecipePackageError("The ZIP uses an unsupported layout or has too many files.");
  const entries: Entry[] = [];
  let cursor = directoryOffset;
  const decoder = new TextDecoder("utf-8", { fatal: true });
  for (let i = 0; i < count; i++) {
    if (cursor + 46 > eocd || data.readUInt32LE(cursor) !== 0x02014b50)
      throw new RecipePackageError("The ZIP directory is damaged.");
    const flags = data.readUInt16LE(cursor + 8);
    const method = data.readUInt16LE(cursor + 10);
    const crc = data.readUInt32LE(cursor + 16);
    const compressedSize = data.readUInt32LE(cursor + 20);
    const size = data.readUInt32LE(cursor + 24);
    const nameLength = data.readUInt16LE(cursor + 28);
    const extraLength = data.readUInt16LE(cursor + 30);
    const commentLength = data.readUInt16LE(cursor + 32);
    const offset = data.readUInt32LE(cursor + 42);
    const end = cursor + 46 + nameLength + extraLength + commentLength;
    if (end > eocd || flags & 1 || [compressedSize, size, offset].includes(0xffffffff))
      throw new RecipePackageError("The ZIP is encrypted, damaged, or uses ZIP64.");
    let name: string;
    try { name = decoder.decode(data.subarray(cursor + 46, cursor + 46 + nameLength)); }
    catch { throw new RecipePackageError("ZIP file names must be UTF-8."); }
    if (name.startsWith("/") || name.includes("\\") || name.split("/").some((part) => part === ".." || part === "."))
      throw new RecipePackageError("The ZIP contains an unsafe file path.");
    const mode = data.readUInt32LE(cursor + 38) >>> 16;
    if ((mode & 0o170000) === 0o120000)
      throw new RecipePackageError("ZIP symlinks are not accepted.");
    if (!name.endsWith("/")) entries.push({ name, method, compressedSize, size, crc, offset });
    cursor = end;
  }
  if (cursor !== directoryOffset + directorySize)
    throw new RecipePackageError("The ZIP directory size does not match its entries.");
  const roots = new Set(entries.map((entry) => entry.name.split("/")[0]));
  const prefix = roots.size === 1 && entries.every((entry) => entry.name.includes("/"))
    ? `${[...roots][0]}/` : "";
  const files: PackageEnvelope["files"] = [];
  const seen = new Set<string>();
  let total = 0;
  for (const entry of entries) {
    const path = entry.name.slice(prefix.length);
    if (!allowed.test(path) || path.split("/").some((part) => part.startsWith(".") || part === "__pycache__"))
      continue;
    if (!/^[A-Za-z0-9_./-]+$/.test(path) || !path || seen.has(path.toLowerCase()))
      throw new RecipePackageError("The ZIP contains an invalid or duplicate recipe file path.");
    if (entry.size > MAX_FILE_BYTES || entry.size > entry.compressedSize * 200 + 1024 ||
        total + entry.size > MAX_TEXT_BYTES || files.length >= 512)
      throw new RecipePackageError("The ZIP exceeds the safe text extraction limits.");
    if (![0, 8].includes(entry.method) || entry.offset + 30 > data.length ||
        data.readUInt32LE(entry.offset) !== 0x04034b50)
      throw new RecipePackageError("The ZIP uses unsupported compression or a damaged file header.");
    const start = entry.offset + 30 + data.readUInt16LE(entry.offset + 26) + data.readUInt16LE(entry.offset + 28);
    const end = start + entry.compressedSize;
    if (end > directoryOffset) throw new RecipePackageError("The ZIP file data is damaged.");
    let contentBytes: Buffer;
    try {
      contentBytes = entry.method === 0
        ? data.subarray(start, end)
        : inflateRawSync(data.subarray(start, end), { maxOutputLength: MAX_FILE_BYTES + 1 });
    } catch { throw new RecipePackageError("The ZIP file could not be decompressed safely."); }
    if (contentBytes.length !== entry.size || crc32(contentBytes) !== entry.crc)
      throw new RecipePackageError("The ZIP file failed its integrity check.");
    let content: string;
    try { content = decoder.decode(contentBytes).replace(/^\uFEFF/, ""); }
    catch { throw new RecipePackageError("Recipe source files must contain UTF-8 text."); }
    seen.add(path.toLowerCase());
    total += entry.size;
    files.push({ path, content });
  }
  if (!files.some((file) => file.path === "recipe.yaml" || file.path.endsWith("/recipe.yaml")))
    throw new RecipePackageError("No recipe.yaml file was found in this ZIP.");
  return { files };
}
