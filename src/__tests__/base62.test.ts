import { generateId } from "@/lib/base62";

describe("generateId", () => {
  it("returns correct default length of 7", () => {
    expect(generateId()).toHaveLength(7);
  });

  it("respects custom length", () => {
    expect(generateId(3)).toHaveLength(3);
    expect(generateId(10)).toHaveLength(10);
  });

  it("only contains base62 characters", () => {
    const id = generateId(20);
    expect(id).toMatch(/^[0-9A-Za-z]+$/);
  });

  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => generateId()));
    expect(ids.size).toBe(1000);
  });
});
