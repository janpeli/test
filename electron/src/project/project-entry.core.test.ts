import { describe, expect, it } from "vitest";
import { deriveEntryNameParts } from "./project-entry.core";

describe("deriveEntryNameParts", () => {
  it("keeps a folder's full name intact when it contains dots", () => {
    expect(deriveEntryNameParts("v1.2.3", true)).toEqual({
      name: "v1.2.3",
      fileExtension: "",
      sufix: "",
    });
    expect(deriveEntryNameParts("my.folder", true)).toEqual({
      name: "my.folder",
      fileExtension: "",
      sufix: "",
    });
  });

  it("keeps a dotless folder name unchanged", () => {
    expect(deriveEntryNameParts("plugins", true)).toEqual({
      name: "plugins",
      fileExtension: "",
      sufix: "",
    });
  });

  it("strips a single extension off a regular file", () => {
    expect(deriveEntryNameParts("readme.md", false)).toEqual({
      name: "readme",
      fileExtension: "md",
      sufix: "md",
    });
  });

  it("uses the inner segment as sufix for *.schm.yaml-style files", () => {
    expect(deriveEntryNameParts("model.schm.yaml", false)).toEqual({
      name: "model.schm",
      fileExtension: "yaml",
      sufix: "schm",
    });
  });

  it("does not use an inner segment as sufix for non-yaml double extensions", () => {
    expect(deriveEntryNameParts("archive.tar.gz", false)).toEqual({
      name: "archive.tar",
      fileExtension: "gz",
      sufix: "gz",
    });
  });

  it("handles a dotless file name", () => {
    expect(deriveEntryNameParts("Makefile", false)).toEqual({
      name: "Makefile",
      fileExtension: "Makefile",
      sufix: "Makefile",
    });
  });
});
