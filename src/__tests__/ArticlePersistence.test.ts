import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { saveArticles, loadArticles } from "../services/ArticlePersistence";
import { Article } from "../types";

const sampleArticle: Article = {
  id: "test-1",
  title: "Test Article",
  subtitle: "A subtitle",
  body: ["Paragraph one.", "Paragraph two."],
  sourceTags: ["politics"],
  sourceId: "test-source",
  url: "https://example.com/1",
  fetchedAt: 1700000000000,
};

describe("ArticlePersistence", () => {
  let tmpDir: string;
  let filePath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "article-persist-"));
    filePath = path.join(tmpDir, "articles.json");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("saveArticles", () => {
    it("writes articles to the specified path as JSON", () => {
      saveArticles([sampleArticle], filePath);
      const raw = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(raw);
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe("test-1");
    });

    it("creates parent directories if they do not exist", () => {
      const nested = path.join(tmpDir, "sub", "dir", "articles.json");
      saveArticles([sampleArticle], nested);
      expect(fs.existsSync(nested)).toBe(true);
    });

    it("overwrites an existing file", () => {
      saveArticles([sampleArticle], filePath);
      const article2 = { ...sampleArticle, id: "test-2" };
      saveArticles([article2], filePath);
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe("test-2");
    });
  });

  describe("loadArticles", () => {
    it("loads articles from a valid JSON file", () => {
      saveArticles([sampleArticle], filePath);
      const articles = loadArticles(filePath);
      expect(articles).toHaveLength(1);
      expect(articles[0].title).toBe("Test Article");
      expect(articles[0].body).toEqual(["Paragraph one.", "Paragraph two."]);
    });

    it("returns empty array when file does not exist", () => {
      const articles = loadArticles(path.join(tmpDir, "missing.json"));
      expect(articles).toEqual([]);
    });

    it("returns empty array when file contains invalid JSON", () => {
      fs.writeFileSync(filePath, "not json {{{");
      const articles = loadArticles(filePath);
      expect(articles).toEqual([]);
    });

    it("returns empty array when file contains non-array JSON", () => {
      fs.writeFileSync(filePath, JSON.stringify({ not: "an array" }));
      const articles = loadArticles(filePath);
      expect(articles).toEqual([]);
    });

    it("filters out items missing required fields", () => {
      const valid = sampleArticle;
      const invalid = { id: "bad", title: "Missing fields" }; // missing body, sourceTags, etc.
      fs.writeFileSync(filePath, JSON.stringify([valid, invalid]));
      const articles = loadArticles(filePath);
      expect(articles).toHaveLength(1);
      expect(articles[0].id).toBe("test-1");
    });
  });
});
