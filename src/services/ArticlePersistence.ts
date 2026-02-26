import * as fs from "fs";
import * as path from "path";
import { Article } from "../types";

export function saveArticles(articles: Article[], filePath: string): void {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(articles, null, 2), "utf-8");
}

export function loadArticles(filePath: string): Article[] {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(isValidArticle);
  } catch {
    return [];
  }
}

function isValidArticle(item: any): item is Article {
  return (
    typeof item === "object" &&
    item !== null &&
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    Array.isArray(item.body) &&
    Array.isArray(item.sourceTags) &&
    typeof item.sourceId === "string" &&
    typeof item.url === "string" &&
    typeof item.fetchedAt === "number"
  );
}
