import { deflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { readRecipeZip } from "./zip";

function crc32(bytes: Buffer) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function zip(entries: { name: string; content: string; mode?: number }[]) {
  const parts: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name);
    const content = Buffer.from(entry.content);
    const compressed = deflateRawSync(content);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(crc32(content), 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(content.length, 22);
    local.writeUInt16LE(name.length, 26);
    parts.push(local, name, compressed);
    const header = Buffer.alloc(46);
    header.writeUInt32LE(0x02014b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(20, 6);
    header.writeUInt16LE(8, 10);
    header.writeUInt32LE(crc32(content), 16);
    header.writeUInt32LE(compressed.length, 20);
    header.writeUInt32LE(content.length, 24);
    header.writeUInt16LE(name.length, 28);
    header.writeUInt32LE(((entry.mode ?? 0o100644) << 16) >>> 0, 38);
    header.writeUInt32LE(offset, 42);
    central.push(header, name);
    offset += local.length + name.length + compressed.length;
  }
  const centralBytes = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBytes.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, centralBytes, end]);
}

describe("recipe ZIP intake", () => {
  it("extracts UTF-8 recipe files without running them", () => {
    const result = readRecipeZip(zip([
      { name: "team/capabilities/example/recipe.yaml", content: "id: example\n" },
      { name: "team/capabilities/example/schemas/input.schema.json", content: '{"type":"object"}' },
      { name: "team/notes.bin", content: "ignored" },
    ]));
    expect(result.files.map((file) => file.path)).toEqual([
      "capabilities/example/recipe.yaml",
      "capabilities/example/schemas/input.schema.json",
    ]);
  });
  it("rejects traversal, symlinks and damaged content", () => {
    expect(() => readRecipeZip(zip([{ name: "../recipe.yaml", content: "x" }]))).toThrow();
    expect(() => readRecipeZip(zip([{ name: "recipe.yaml", content: "x", mode: 0o120777 }]))).toThrow();
    const damaged = zip([{ name: "recipe.yaml", content: "id: example" }]);
    damaged.writeUInt32LE(0, damaged.length - 22 - (46 + "recipe.yaml".length) + 16);
    expect(() => readRecipeZip(damaged)).toThrow(/integrity/);
  });
  it("rejects duplicate names, including case collisions", () => {
    expect(() => readRecipeZip(zip([
      { name: "recipe.yaml", content: "id: example" },
      { name: "RECIPE.yaml", content: "id: other" },
    ]))).toThrow(/duplicate/);
  });
  it("rejects encrypted, truncated and oversized archives", () => {
    const encrypted = zip([{ name: "recipe.yaml", content: "id: example" }]);
    const centralOffset = encrypted.readUInt32LE(encrypted.length - 6);
    encrypted.writeUInt16LE(1, centralOffset + 8);
    expect(() => readRecipeZip(encrypted)).toThrow(/encrypted/);

    const truncated = zip([{ name: "recipe.yaml", content: "id: example" }]);
    expect(() => readRecipeZip(truncated.subarray(0, -1))).toThrow(/supported ZIP/);

    const oversized = zip([{ name: "recipe.yaml", content: "a".repeat(256 * 1024 + 1) }]);
    expect(() => readRecipeZip(oversized)).toThrow(/safe text extraction/);
  });
  it("rejects more than 512 supported text files", () => {
    const many = zip([
      { name: "recipe.yaml", content: "id: example" },
      ...Array.from({ length: 512 }, (_, i) => ({ name: `note-${i}.txt`, content: "x" })),
    ]);
    expect(() => readRecipeZip(many)).toThrow(/safe text extraction/);
  });
});
