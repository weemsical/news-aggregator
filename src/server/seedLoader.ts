import { ArticleRepository, RawArticleRepository } from "@repositories";
import { seedArticles } from "../data/seedArticles";

export async function loadSeedData(repos: {
  articles: ArticleRepository;
  rawArticles: RawArticleRepository;
}): Promise<void> {
  const existing = await repos.articles.count();
  if (existing > 0) return;

  const rawArticles = seedArticles.map((a) => ({
    id: a.rawArticleId,
    title: a.title,
    body: a.body,
    sourceId: a.sourceId,
    url: a.url,
    fetchedAt: a.fetchedAt,
  }));

  await repos.rawArticles.saveBatch(rawArticles);
  await repos.articles.saveBatch(seedArticles);
}
