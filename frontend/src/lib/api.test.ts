import { describe, expect, it } from "vitest";
import { API_BASE } from "./api";

describe("API_BASE", () => {
  it("defaults to local backend", () => {
    expect(API_BASE).toMatch(/^https?:\/\//);
  });
});
