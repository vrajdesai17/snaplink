import { generateSemanticSlug } from "@/lib/semantic-slug";

describe("generateSemanticSlug", () => {
  it("uses known domain abbreviations", () => {
    expect(generateSemanticSlug("https://github.com/vercel/next.js")).toBe("gh-vercel-next");
  });

  it("uses yt for youtube", () => {
    const slug = generateSemanticSlug("https://youtube.com/watch?v=abc123");
    expect(slug).toMatch(/^yt/);
  });

  it("extracts domain keywords for unknown domains", () => {
    const slug = generateSemanticSlug("https://docs.example.com/getting-started");
    expect(slug.length).toBeGreaterThan(0);
  });

  it("returns empty string for unparseable input", () => {
    expect(generateSemanticSlug("not-a-url")).toBe("");
  });

  it("never exceeds 22 characters", () => {
    const slug = generateSemanticSlug(
      "https://github.com/some-very-long-org-name/an-extremely-long-repo-name"
    );
    expect(slug.length).toBeLessThanOrEqual(22);
  });

  it("contains no trailing hyphens", () => {
    const slug = generateSemanticSlug("https://github.com/vercel/next.js");
    expect(slug).not.toMatch(/-$/);
  });
});
